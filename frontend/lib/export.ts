export function exportFleetCSV(ships: any[]) {
  const headers = [
    "ID","Name","Status","Risk Score","Cargo","Cargo Value (USD)","Origin","Destination",
    "Latitude","Longitude","Speed (knots)","Delay (hours)","Vessel Type","Company","Flag","ETA"
  ];
  const rows = ships.map(s => [
    s.id, s.name, s.status, s.risk_score || 0, s.cargo,
    s.cargo_value_usd || 0, s.origin, s.destination,
    s.lat?.toFixed(4), s.lng?.toFixed(4), s.speed_knots, s.delay_hours,
    s.vessel_type, s.company, s.flag, s.eta
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fleet-status-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAlertsCSV(alerts: any[]) {
  const headers = ["ID","Type","Severity","Message","Ship ID","Actionable","Timestamp"];
  const rows = alerts.map(a => [
    a.id, a.type, a.severity, a.message, a.ship_id || "", a.actionable, a.timestamp || ""
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'\\"')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `alerts-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAuditCSV(log: any[]) {
  const headers = ["ID","Ship Name","Ship ID","New Destination","CO2 Saved (tons)","Auto Pilot","Reason","Timestamp"];
  const rows = log.map(l => [
    l.id, l.ship_name || "", l.ship_id, l.new_destination, l.co2_saved || 0,
    l.auto ? "Yes" : "No", l.reason || "", l.timestamp || ""
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'\\"')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
