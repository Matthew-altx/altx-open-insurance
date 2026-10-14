import { test } from "node:test";
import assert from "node:assert/strict";
import ICAL from "ical.js";
import {
  validDate,
  validMonthDay,
  validateCard,
  validateClients,
  blankCard,
  makeIcs,
  occurrence,
  nextOccurrence,
  telephone,
  cardSections,
  foldLine,
} from "../src/core.js";
const client = {
  id: "4ea1b9b2-f80b-4485-9eb2-f86a853c0aef",
  name: "陳,小;明\\測試\n第二行",
  birthday: "02-29",
  anniversary: "12-31",
  sequence: 4,
};
test("calendar dates reject invalid and ambiguous inputs", () => {
  for (const d of [
    "2027-02-29",
    "2026-02-30",
    "2026-13-01",
    "01/02/2026",
    "0000-01-01",
  ])
    assert.equal(validDate(d), false);
  assert.ok(validDate("2028-02-29"));
  assert.ok(validMonthDay("02-29"));
  assert.equal(validMonthDay("02-30"), false);
});
test("leap and century year occurrences", () => {
  assert.equal(occurrence("02-29", 2027), "2027-02-28");
  assert.equal(occurrence("02-29", 2028), "2028-02-29");
  assert.equal(occurrence("02-29", 2100), "2100-02-28");
  assert.equal(nextOccurrence("01-01", "2026-12-31"), "2027-01-01");
});
test("ICS independently parses escapes, stable UID, sequence, timezone and leap recurrence", () => {
  const output = makeIcs([client], new Date("2026-09-27T00:00:00Z"));
  const root = new ICAL.Component(ICAL.parse(output));
  const components = root.getAllSubcomponents("vevent");
  assert.equal(components.length, 2);
  assert.equal(
    root.getFirstSubcomponent("vtimezone").getFirstPropertyValue("tzid"),
    "Asia/Hong_Kong",
  );
  const event = new ICAL.Event(components[0]);
  assert.equal(event.summary, client.name + "・生日");
  assert.equal(event.sequence, 4);
  assert.equal(event.startDate.hour, 9);
  assert.equal(
    components[0].getFirstProperty("dtstart").getParameter("tzid"),
    "Asia/Hong_Kong",
  );
  assert.equal(
    components[0]
      .getFirstSubcomponent("valarm")
      .getFirstPropertyValue("trigger")
      .toSeconds(),
    0,
  );
  const it = event.iterator();
  const dates = [];
  for (let i = 0; i < 74; i++) dates.push(it.next().toString().slice(0, 10));
  assert.ok(dates.includes("2027-02-28"));
  assert.ok(dates.includes("2028-02-29"));
  assert.ok(dates.includes("2100-02-28"));
  const second = new ICAL.Component(
    ICAL.parse(
      makeIcs(
        [{ ...client, name: "Changed", sequence: 5 }],
        new Date("2026-09-28Z"),
      ),
    ),
  );
  assert.equal(
    second.getFirstSubcomponent("vevent").getFirstPropertyValue("uid"),
    event.uid,
  );
  assert.equal(
    second.getFirstSubcomponent("vevent").getFirstPropertyValue("sequence"),
    5,
  );
});
test("UTF-8 folding never splits characters and stays within 75 octets", () => {
  const line = "SUMMARY:" + "中文😀,;\\".repeat(100);
  const folded = foldLine(line);
  for (const l of folded.split("\r\n")) assert.ok(Buffer.byteLength(l) <= 75);
  assert.equal(folded.replace(/\r\n /g, ""), line);
});
test("quotas and partial reminder input", () => {
  assert.equal(validateClients([{ ...client, anniversary: "" }]).length, 0);
  assert.ok(validateClients(Array.from({ length: 11 }, () => client)).length);
  assert.ok(
    validateClients([{ ...client, birthday: "", anniversary: "" }]).length,
  );
  assert.ok(validateClients([{ ...client, birthday: "02-30" }]).length);
});
test("travel requires hotline, valid ordered dates and review; unknown medical stays unknown", () => {
  const d = {
    ...blankCard(),
    name: "Test",
    company: "Example",
    destination: "Tokyo",
    departure: "2026-12-10",
    returnDate: "2026-12-01",
  };
  assert.ok(validateCard(d, "travel").some((x) => x.includes("回程")));
  assert.ok(validateCard(d, "travel").some((x) => x.includes("熱線")));
  assert.ok(
    cardSections(d, "travel").some((s) =>
      s.rows.some((r) => r[0] === "醫療保額" && r[1] === "未提供"),
    ),
  );
  assert.equal(
    validateCard(
      {
        ...d,
        returnDate: "2026-12-12",
        hotline: "+852 0000 0000",
        reviewed: "2026-09-27",
      },
      "travel",
    ).length,
    0,
  );
});
test("safe telephone links reject URL schemes and scripts", () => {
  assert.equal(telephone("+852 2345 6789"), "tel:+85223456789");
  assert.equal(telephone("javascript:alert(1)"), null);
  assert.equal(telephone(""), null);
});
