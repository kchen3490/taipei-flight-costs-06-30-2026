"""
Fetch east-coast → TPE flight prices via SerpAPI Google Flights.

Usage:
    export SERPAPI_KEY="your_key_here"
    python scripts/fetch_flights.py

Output: data/flights.json
"""

import json
import os
import time
from itertools import product
from pathlib import Path
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY       = os.environ.get("SERPAPI_KEY", "")
SERPAPI_URL   = "https://serpapi.com/search"

ORIGINS       = ["BWI", "DCA", "IAD", "PHL"]
DESTINATION   = "TPE"
OUTBOUND_DATE = "2026-06-29"
RETURN_DATE   = "2026-08-28"
CURRENCY      = "USD"
TRAVEL_CLASS  = 1   # 1=economy, 2=premium economy, 3=business, 4=first
CABIN         = {1: "economy", 2: "premium economy", 3: "business", 4: "first"}[TRAVEL_CLASS]
ADULTS        = 1

# GRR-related searches
GRR_AIRPORT    = "GRR"
MD_TO_GRR_DATE = "2026-06-24"
GRR_RT_RETURN  = "2026-06-30"

OUTPUT_PATH   = Path(__file__).parent.parent / "data" / "flights.json"

# Pause between API calls to stay within rate limits (free tier: 100 searches/mo)
REQUEST_DELAY_S = 1.5

# ── SerpAPI helper ────────────────────────────────────────────────────────────
def search_flights(departure_id, arrival_id, outbound_date, return_date=None):
    params = {
        "engine":        "google_flights",
        "departure_id":  departure_id,
        "arrival_id":    arrival_id,
        "outbound_date": outbound_date,
        "currency":      CURRENCY,
        "hl":            "en",
        "gl":            "us",
        "adults":        ADULTS,
        "travel_class":  TRAVEL_CLASS,
        "sort_by":       2,   # sort by price (cheapest first)
        "api_key":       API_KEY,
    }
    if return_date:
        params["type"]        = 1   # round-trip
        params["return_date"] = return_date
    else:
        params["type"] = 2          # one-way

    resp = requests.get(SERPAPI_URL, params=params, timeout=20)
    resp.raise_for_status()
    return resp.json()


# ── URL builder ──────────────────────────────────────────────────────────────
def make_search_url(origin, destination, outbound_date, return_date=None):
    """Construct a Google Flights search URL for this route when the API doesn't return one."""
    q = f"Flights from {origin} to {destination} on {outbound_date}"
    if return_date:
        q += f" returning {return_date}"
    return "https://www.google.com/travel/flights?" + urlencode({"q": q})


# ── Parse results ─────────────────────────────────────────────────────────────
def parse_best_flights(data, origin, destination, ticket_type, outbound_date, return_date=None):
    """Extract top results from a SerpAPI google_flights response."""

    # Search-level fields shared by every itinerary in this response
    google_flights_url  = data.get("google_flights_url") or make_search_url(origin, destination, outbound_date, return_date)
    price_insights      = data.get("price_insights", {})
    price_history       = price_insights.get("price_history", [])        # [[ts, price], ...]
    typical_price_range = price_insights.get("typical_price_range", [])  # [low, high]

    records = []

    for section in ("best_flights", "other_flights"):
        for itinerary in data.get(section, []):
            flights = itinerary.get("flights", [])
            if not flights:
                continue

            # Deduplicated airline names across all legs
            airlines = list(dict.fromkeys(f.get("airline", "") for f in flights))
            airline_str = " + ".join(a for a in airlines if a)

            stops = len(flights) - 1
            # Intermediate airports (all legs except the last arrival)
            hubs = [f["arrival_airport"]["id"] for f in flights[:-1]] if stops > 0 else []
            hub  = ", ".join(hubs) if hubs else None

            duration_min = itinerary.get("total_duration", 0)
            duration_str = f"{duration_min // 60}h {duration_min % 60:02d}m" if duration_min else ""

            price = itinerary.get("price")
            if price is None:
                continue

            stops_label = "nonstop" if stops == 0 else f"via {hubs[0]}"
            combination = f"{airline_str} {stops_label} {origin}→{destination}"

            records.append({
                "ticket_type":        ticket_type,
                "origin":             origin,
                "destination":        destination,
                "airline":            airline_str,
                "combination":        combination,
                "outbound_date":      outbound_date,
                "return_date":        return_date,
                "stops":              stops,
                "hub":                hub,
                "price_usd":          price,
                "cabin":              CABIN,
                "duration_outbound":  duration_str,
                "carbon_emissions":   itinerary.get("carbon_emissions", {}).get("this_flight"),
                # Linking & price-history fields from the search-level response
                "google_flights_url": google_flights_url,
                "price_history":      price_history,
                "typical_price_range": typical_price_range,
            })

    return records


# ── Two-one-way combiner ──────────────────────────────────────────────────────
def build_two_one_way_combos(outbound_records, return_records):
    """
    Pair every outbound one-way with every return one-way that shares the same origin.
    Only keep combos where the pair airlines differ (otherwise user would just book RT).
    """
    combos = []
    for out, ret in product(outbound_records, return_records):
        if out["origin"] != ret["origin"]:
            continue
        if out["airline"] == ret["airline"]:
            continue   # same airline → round-trip booking is better

        total = out["price_usd"] + ret["price_usd"]
        combo_label = (
            f"{out['airline']} (out) + {ret['airline']} (ret) "
            f"{'nonstop' if out['stops'] == 0 else 'via ' + str(out['hub'])} "
            f"{out['origin']}↔{out['destination']}"
        )

        combos.append({
            "ticket_type":        "two_one_ways",
            "origin":             out["origin"],
            "destination":        out["destination"],
            "airline":            f"{out['airline']} + {ret['airline']}",
            "combination":        combo_label,
            "outbound_date":      out["outbound_date"],
            "return_date":        ret["outbound_date"],
            "stops":              out["stops"],
            "hub":                out["hub"],
            "price_usd":          total,
            "price_outbound":     out["price_usd"],
            "price_return":       ret["price_usd"],
            "cabin":              "economy",
            "duration_outbound":  out["duration_outbound"],
            "google_flights_url": out.get("google_flights_url"),
            "price_history":      out.get("price_history", []),
            "typical_price_range": out.get("typical_price_range", []),
        })

    combos.sort(key=lambda r: r["price_usd"])
    seen = set()
    unique = []
    for c in combos:
        key = (c["origin"], c["airline"])
        if key not in seen:
            seen.add(key)
            unique.append(c)

    return unique


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    if not API_KEY:
        raise SystemExit("❌  Set SERPAPI_KEY environment variable before running.")

    all_records      = []
    outbound_ow      = []   # one-way outbound legs (for combo building)
    return_ow        = []   # one-way return legs

    for origin in ORIGINS:
        print(f"\n── {origin} → {DESTINATION} ──────────────────────────────")

        # 1. Round-trip
        print(f"  [RT]  {origin} → {DESTINATION}  {OUTBOUND_DATE} / {RETURN_DATE}")
        try:
            data = search_flights(origin, DESTINATION, OUTBOUND_DATE, RETURN_DATE)
            rt_records = parse_best_flights(data, origin, DESTINATION, "round_trip",
                                            OUTBOUND_DATE, RETURN_DATE)
            print(f"        → {len(rt_records)} itineraries")
            all_records.extend(rt_records)
            time.sleep(REQUEST_DELAY_S)
        except Exception as e:
            print(f"        ✗ {e}")

        # 2. One-way outbound
        print(f"  [OW→] {origin} → {DESTINATION}  {OUTBOUND_DATE}")
        try:
            data = search_flights(origin, DESTINATION, OUTBOUND_DATE)
            ow_out = parse_best_flights(data, origin, DESTINATION, "one_way",
                                        OUTBOUND_DATE)
            print(f"        → {len(ow_out)} itineraries")
            outbound_ow.extend(ow_out)
            all_records.extend(ow_out)
            time.sleep(REQUEST_DELAY_S)
        except Exception as e:
            print(f"        ✗ {e}")

        # 3. One-way return (TPE → origin on Aug 28)
        print(f"  [OW←] {DESTINATION} → {origin}  {RETURN_DATE}")
        try:
            data = search_flights(DESTINATION, origin, RETURN_DATE)
            ow_ret = parse_best_flights(data, origin, DESTINATION, "one_way_return",
                                        RETURN_DATE)
            print(f"        → {len(ow_ret)} itineraries")
            return_ow.extend(ow_ret)
            time.sleep(REQUEST_DELAY_S)
        except Exception as e:
            print(f"        ✗ {e}")

    # 4. Build two-one-way combos
    print("\n── Building two-one-way combinations ────────────────────────")
    combos = build_two_one_way_combos(outbound_ow, return_ow)
    print(f"   → {len(combos)} combinations")
    all_records.extend(combos)

    # Tag all TPE-group records
    for r in all_records:
        r.setdefault("group", "tpe")

    # ── GRR searches ──────────────────────────────────────────────────────────
    grr_records = []

    # 5. GRR → TPE one-way (June 29)
    print(f"\n── {GRR_AIRPORT} → {DESTINATION} (one-way) ──────────────────────────")
    print(f"  [OW→] {GRR_AIRPORT} → {DESTINATION}  {OUTBOUND_DATE}")
    try:
        data = search_flights(GRR_AIRPORT, DESTINATION, OUTBOUND_DATE)
        recs = parse_best_flights(data, GRR_AIRPORT, DESTINATION, "grr_one_way", OUTBOUND_DATE)
        for r in recs:
            r["group"] = "grr"
        print(f"        → {len(recs)} itineraries")
        grr_records.extend(recs)
        time.sleep(REQUEST_DELAY_S)
    except Exception as e:
        print(f"        ✗ {e}")

    # 6. MD airports → GRR one-way (June 24)
    print(f"\n── MD airports → {GRR_AIRPORT} one-ways ({MD_TO_GRR_DATE}) ─────────────")
    for origin in ORIGINS:
        print(f"  [OW→] {origin} → {GRR_AIRPORT}  {MD_TO_GRR_DATE}")
        try:
            data = search_flights(origin, GRR_AIRPORT, MD_TO_GRR_DATE)
            recs = parse_best_flights(data, origin, GRR_AIRPORT, "md_grr_one_way", MD_TO_GRR_DATE)
            for r in recs:
                r["group"] = "grr"
            print(f"        → {len(recs)} itineraries")
            grr_records.extend(recs)
            time.sleep(REQUEST_DELAY_S)
        except Exception as e:
            print(f"        ✗ {e}")

    # 7. MD airports → GRR round-trip (June 24 – June 30)
    print(f"\n── MD airports → {GRR_AIRPORT} round-trips ({MD_TO_GRR_DATE} / {GRR_RT_RETURN}) ─")
    for origin in ORIGINS:
        print(f"  [RT]  {origin} → {GRR_AIRPORT}  {MD_TO_GRR_DATE} / {GRR_RT_RETURN}")
        try:
            data = search_flights(origin, GRR_AIRPORT, MD_TO_GRR_DATE, GRR_RT_RETURN)
            recs = parse_best_flights(data, origin, GRR_AIRPORT, "md_grr_round_trip",
                                      MD_TO_GRR_DATE, GRR_RT_RETURN)
            for r in recs:
                r["group"] = "grr"
            print(f"        → {len(recs)} itineraries")
            grr_records.extend(recs)
            time.sleep(REQUEST_DELAY_S)
        except Exception as e:
            print(f"        ✗ {e}")

    all_records.extend(grr_records)

    # 8. Write output
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(all_records, f, indent=2)

    print(f"\n✅  Wrote {len(all_records)} records → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
