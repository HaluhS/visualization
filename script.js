// Set up the dimensions and margins for the SVG
const margin = { top: 40, right: 20, bottom: 70, left: 80 }; 
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Append an SVG group element to the chart
const svg = d3
  .select("#chart")
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

let genreVotes = [];
let originalData = [];

// Load the CSV data
d3.csv("movies.csv").then((data) => {
  // Parse and group data by genre
  const genreData = d3.group(data, (d) => d.genre);

  // Calculate the average votes and scores for each genre
  genreVotes = Array.from(genreData, ([key, values]) => ({
    genre: key,
    averageVotes: d3.mean(values, (d) => +d.votes || 0),
    averageScores: d3.mean(values, (d) => +d.score || 0), // Assuming 'score' column exists
  })).filter((d) => d.genre); // Remove rows with empty genre

  // Store original data for resetting
  originalData = [...genreVotes];

  // Dynamically populate the dropdown with unique genres
  const dropdown = d3.select("#filter");
  dropdown
    .selectAll("option")
    .data([{ genre: "all" }, ...genreVotes]) // Add "all" option at the top
    .enter()
    .append("option")
    .attr("value", (d) => d.genre)
    .text((d) => (d.genre === "all" ? "All Genres" : d.genre));

  // Set up scales
  const x = d3
    .scaleBand()
    .domain(genreVotes.map((d) => d.genre))
    .range([0, width])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(genreVotes, (d) => d.averageVotes)])
    .nice()
    .range([height, 0]);

  // Add axes
  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));


// Add x-axis label
svg.append("text")
  .attr("class", "x-axis-label")
  .attr("text-anchor", "middle")
  .attr("x", width / 2)
  .attr("y", height + margin.bottom - 10) // Move even further below the graph
  .text("Genres");

// Add y-axis label
svg.append("text")
  .attr("class", "y-axis-label")
  .attr("text-anchor", "middle")
  .attr("x", -height / 2)
  .attr("y", -margin.left + 20) // Move further away from the bars
  .attr("transform", "rotate(-90)")
  .text("Average Votes");


  // Tooltip for hover 
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "#fff")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("font-size", "12px");

  // draw or update bars
  function drawBars(data) {
    // Update scales
    x.domain(data.map((d) => d.genre));
    y.domain([0, d3.max(data, (d) => d.averageVotes)]).nice();

    // Update axes
    svg
      .select(".x-axis")
      .transition()
      .duration(1000)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.select(".y-axis").transition().duration(1000).call(d3.axisLeft(y));

    // Bind data to bars
    const bars = svg.selectAll(".bar").data(data, (d) => d.genre);

    // Enter new bars
    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.genre))
      .attr("y", y(0)) // Start from the bottom
      .attr("width", x.bandwidth())
      .attr("height", 0) // Start with height 0
      .attr("fill", "steelblue")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "darkblue"); // Highlight bar
        tooltip
          .style("visibility", "visible")
          .html(`Genre: ${d.genre}<br>Avg Votes: ${Math.round(d.averageVotes)}`)
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "steelblue"); // Reset bar color
        tooltip.style("visibility", "hidden");
      })
      .transition()
      .duration(1000)
      .attr("y", (d) => y(d.averageVotes))
      .attr("height", (d) => height - y(d.averageVotes));

    // Update existing bars
    bars
      .transition()
      .duration(1000)
      .attr("x", (d) => x(d.genre))
      .attr("y", (d) => y(d.averageVotes))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.averageVotes));

    // Remove old bars
    bars.exit().transition().duration(1000).attr("height", 0).remove();
  }

  //initial bars
  drawBars(genreVotes);

  // Button click 
  d3.select("#sortVotes").on("click", () => {
    const sortedData = [...genreVotes].sort((a, b) => b.averageVotes - a.averageVotes);
    drawBars(sortedData);
  });

  d3.select("#sortScores").on("click", () => {
    const sortedData = [...genreVotes].sort((a, b) => b.averageScores - a.averageScores);
    drawBars(sortedData);
  });

  d3.select("#reset").on("click", () => {
    drawBars(originalData);
  });

  d3.select("#filter").on("change", function () {
    const selectedGenre = this.value;

    const filteredData =
      selectedGenre === "all"
        ? originalData
        : originalData.filter((d) => d.genre === selectedGenre);

    drawBars(filteredData);
  });
}).catch((error) => {
  console.error("Error loading the CSV file:", error);
});
