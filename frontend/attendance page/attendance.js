src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js";

// Save as CSV
document.getElementById("save-csv").addEventListener("click", function () {
  const table = document.getElementById("attendance-table");
  let csv = "";

  for (let row of table.rows) {
    let cells = Array.from(row.cells).map((cell) => cell.textContent.trim());
    csv += cells.join(",") + "\n";
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "attendance.csv";
  link.click();
});
