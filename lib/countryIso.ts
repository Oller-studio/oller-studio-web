import worldMap from "@/content/world-map.json";

// ISO 3166-1 alpha-2 -> ISO 3166-1 numeric, matching the `id` field used by
// the world-atlas topojson baked into content/world-map.json. PayPal gives
// us alpha-2 country codes; the map data is keyed by the numeric code.
export const ISO_ALPHA2_TO_NUMERIC: Record<string, string> = {
  AF: "004", AL: "008", DZ: "012", AO: "024", AZ: "031", AR: "032", AU: "036",
  AT: "040", BS: "044", BD: "050", AM: "051", BE: "056", BT: "064", BO: "068",
  BA: "070", BW: "072", BR: "076", BZ: "084", SB: "090", BN: "096", BG: "100",
  MM: "104", BI: "108", BY: "112", KH: "116", CM: "120", CA: "124", CF: "140",
  LK: "144", TD: "148", CL: "152", CN: "156", TW: "158", CO: "170", CG: "178",
  CD: "180", CR: "188", HR: "191", CU: "192", CY: "196", CZ: "203", BJ: "204",
  DK: "208", DO: "214", EC: "218", SV: "222", GQ: "226", ET: "231", ER: "232",
  EE: "233", FK: "238", FJ: "242", FI: "246", FR: "250", TF: "260", DJ: "262",
  GA: "266", GE: "268", GM: "270", PS: "275", DE: "276", GH: "288", GR: "300",
  GL: "304", GT: "320", GN: "324", GY: "328", HT: "332", HN: "340", HU: "348",
  IS: "352", IN: "356", ID: "360", IR: "364", IQ: "368", IE: "372", IL: "376",
  IT: "380", CI: "384", JM: "388", JP: "392", KZ: "398", JO: "400", KE: "404",
  KP: "408", KR: "410", KW: "414", KG: "417", LA: "418", LB: "422", LS: "426",
  LV: "428", LR: "430", LY: "434", LT: "440", LU: "442", MG: "450", MW: "454",
  MY: "458", ML: "466", MR: "478", MX: "484", MN: "496", MD: "498", ME: "499",
  MA: "504", MZ: "508", OM: "512", NA: "516", NP: "524", NL: "528", NC: "540",
  VU: "548", NZ: "554", NI: "558", NE: "562", NG: "566", NO: "578", PK: "586",
  PA: "591", PG: "598", PY: "600", PE: "604", PH: "608", PL: "616", PT: "620",
  GW: "624", TL: "626", PR: "630", QA: "634", RO: "642", RU: "643", RW: "646",
  SA: "682", SN: "686", RS: "688", SL: "694", SK: "703", VN: "704", SI: "705",
  SO: "706", ZA: "710", ZW: "716", ES: "724", SS: "728", SD: "729", EH: "732",
  SR: "740", SZ: "748", SE: "752", CH: "756", SY: "760", TJ: "762", TH: "764",
  TG: "768", TT: "780", AE: "784", TN: "788", TR: "792", TM: "795", UG: "800",
  UA: "804", MK: "807", EG: "818", GB: "826", TZ: "834", US: "840", BF: "854",
  UY: "858", UZ: "860", VE: "862", YE: "887", ZM: "894",
};

const NAME_BY_NUMERIC = new Map(worldMap.countries.map((c) => [c.id, c.name]));

// The map data's Natural-Earth names are more formal than what reads well
// in a short admin list — override the ones worth shortening.
const NAME_OVERRIDES: Record<string, string> = {
  US: "USA",
};

export function getCountryName(alpha2: string): string {
  const code = alpha2.toUpperCase();
  if (NAME_OVERRIDES[code]) return NAME_OVERRIDES[code];
  const numeric = ISO_ALPHA2_TO_NUMERIC[code];
  return (numeric && NAME_BY_NUMERIC.get(numeric)) || code;
}
