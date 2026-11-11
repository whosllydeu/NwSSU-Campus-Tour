import { useMemo, useState } from "react";
import { useCampusData } from "../context/DataContext";
import BuildingCard from "../components/BuildingCard";
import DeptCard from "../components/DeptCard";
import { Navbar } from "../components";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "colleges", label: "Colleges" },
  { key: "buildings", label: "Buildings" },
  { key: "facilities", label: "Facilities" },
];

const matches = (q, ...values) =>
  !q || values.some((v) => v && String(v).toLowerCase().includes(q));

export default function Campus() {
  const { buildings, departments } = useCampusData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // A college card already shows its building, so that building isn't listed twice.
  const { colleges, plainBuildings, facilities } = useMemo(() => {
    const buildingOf = (d) =>
      buildings.find((b) => b.dept === d.id) || buildings.find((b) => b.id === d.id) || null;
    const collegeBuildingIds = new Set(
      departments.map((d) => buildingOf(d)?.id).filter(Boolean)
    );
    const rest = buildings.filter((b) => !collegeBuildingIds.has(b.id));
    return {
      colleges: departments.map((d) => ({ d, building: buildingOf(d) })),
      plainBuildings: rest.filter((b) => b.type !== "facility"),
      facilities: rest.filter((b) => b.type === "facility"),
    };
  }, [buildings, departments]);

  const q = query.trim().toLowerCase();
  const shownColleges = colleges.filter(({ d, building }) =>
    matches(q, d.name, d.abbr, building?.name)
  );
  const shownBuildings = plainBuildings.filter((b) => matches(q, b.name, b.abbr));
  const shownFacilities = facilities.filter((b) => matches(q, b.name, b.abbr));

  const sections = [
    { key: "colleges", title: "Colleges", items: shownColleges, kind: "college" },
    { key: "buildings", title: "Buildings", items: shownBuildings, kind: "building" },
    { key: "facilities", title: "Facilities", items: shownFacilities, kind: "building" },
  ].filter((s) => (filter === "all" || filter === s.key) && s.items.length > 0);

  return (
    <>
      <Navbar />
      <section className="page active" id="page-campus">
        <div className="inner-page">
          <div className="page-header">
            <h1>Campus</h1>
            <p>Colleges, buildings and facilities at NWSSU</p>
          </div>

          <div className="page-search">
            <span className="page-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search the campus…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`fbtn${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {sections.length === 0 ? (
            <div className="page-search-empty">
              {q ? `Nothing matches “${query}”.` : "Nothing to show here yet."}
            </div>
          ) : (
            sections.map((s) => (
              <div className="campus-section" key={s.key}>
                {filter === "all" && <h2 className="campus-section-title">{s.title}</h2>}
                {s.kind === "college" ? (
                  <div className="dept-list" id="deptList">
                    {s.items.map(({ d }) => <DeptCard key={d.id} d={d} />)}
                  </div>
                ) : (
                  <div className="bldg-grid" id={`${s.key}Grid`}>
                    {s.items.map((b) => <BuildingCard key={b.id} b={b} />)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
