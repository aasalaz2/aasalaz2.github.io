// Scene 1: Show Most Popular Anime Over Time (only show top 10)
// Scene 2: Show Popularity vs Rating
// Scene 3: Average Rating by Genre
// Scene 4: Explore Animes in Each Genre

let currentScene = 0;
const totalScenes = 4;
const svg = d3.select("#chart");
const tooltip = d3.select("#tooltip");
let selectedGenre = null;

// Load CSV
// d3.csv("popular_anime.csv").then(data => {
//     window.animeData = data;
//     renderScene(currentScene);
// });

d3.csv("popular_anime.csv").then(data => {
    //  Clean data by getting rid of anime with blank aired_from dates
    data = data.filter(d => d.aired_from && d.aired_from.trim() !== "");
    data.forEach(d => {
        d.members = +d.scored_by || 0;
        d.score = +d.score || 0;
        d.aired_year = new Date(d.aired_from).getFullYear();
    });

    data = data.filter(d => !isNaN(d.aired_year));

    // Filter only anime in the last 40 years (1985-2025)
    // And anime that has no conclusive data
    window.animeData = data
        .filter(d => d.aired_year >= 1985 && d.aired_year <= 2025)
        .filter(d => d.members > 0 && d.score > 0);
    // Extract the years in that range
    window.allYears = Array.from(new Set(window.animeData.map(d => d.aired_year)))
        .sort((a, b) => a - b);

    renderScene(currentScene);
});


// Renders Scene
function renderScene(sceneNumber) {
    // svg.selectAll("*").remove();    // Clears canvas
    svg.selectAll("g.sceneGroup")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();

    svg.selectAll("text").transition().duration(500).style("opacity", 0).remove();

    // Hide genre selector unless in Scene 4
    d3.select("#genreSelector").style("display", "none");

    if (sceneNumber === 0) {
        // const margin = { top: 80, right: 20, bottom: 60, left: 360 };
        // const width = svg.node().getBoundingClientRect().width - margin.left - margin.right;
        // const height = svg.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const bounds = svg.node().getBoundingClientRect();

        const margin = {
            top: bounds.height * 0.1,
            right: bounds.width * 0.05,
            bottom: bounds.height * 0.1,
            left: bounds.width * 0.25
        };

        const width = 1200 - margin.left - margin.right;
        const height = 700 - margin.top - margin.bottom;



        // const g = svg.append("g")
        //     .attr("transform", `translate(${margin.left},${margin.top})`);
        const g = svg.append("g")
            .attr("class", "sceneGroup")
            .style("opacity", 0)
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.transition().duration(500).style("opacity", 1);


        const yearLabel = svg.append("text")
            .attr("id", "yearLabel")
            .attr("text-anchor", "middle")
            .attr("x", 600)
            .attr("y", 40)
            .attr("font-size", "24px")
            .attr("font-weight", "bold")
            .attr("fill", "#444");

        let yearIndex = 0;

        function updateChart(year) {
            // Sort and filter the top 10 animes of the given year
            const filtered = window.animeData.filter(d => d.aired_year <= year);
            const top10 = filtered.sort((a, b) => d3.descending(a.score, b.score)).slice(0, 10);

            // Set scales
            const x = d3.scalePow()
                .exponent(3)
                .domain([0, d3.max(top10, d => d.score)])
                .range([0, width]);
            const y = d3.scaleBand().range([0, height]).padding(0.1);

            x.domain([0, d3.max(top10, d => d.score)]);
            y.domain(top10.map(d => d.name));

            // Draw bars
            const bars = g.selectAll("rect").data(top10, d => d.name);

            bars.enter().append("rect")
                .attr("y", d => y(d.name))
                .attr("x", 0)
                .attr("height", y.bandwidth())
                .attr("width", 0)
                .attr("fill", "#2f51a3")
                .merge(bars)
                    .transition()
                    .duration(1000)
                    .attr("y", d => y(d.name))
                    .attr("height", y.bandwidth())
                    .attr("width", d => x(d.score));

            bars.exit().remove();

            // Add label (anime names) to left of bar
            const leftLabels = g.selectAll("text.nameLabel").data(top10, d => d.name);

            leftLabels.enter().append("text")
                .attr("class", "nameLabel")
                .attr("x", -10)  // slightly outside left edge
                .attr("y", d => y(d.name) + y.bandwidth() / 2 + 5)
                .attr("font-size", "12px")
                .attr("text-anchor", "end")
                .text(d => d.name)
                .merge(leftLabels)
                    .transition()
                    .duration(1000)
                    .attr("y", d => y(d.name) + y.bandwidth() / 2 + 5)
                    .text(d => d.name);

            leftLabels.exit().remove();

            // Add label (ratings) inside each bar
            const ratings = g.selectAll("text.rating").data(top10, d => d.name);

            ratings.enter().append("text")
                .attr("class", "rating")
                .attr("x", d => x(d.score) - 5) // inside right edge of bar
                .attr("y", d => y(d.name) + y.bandwidth() / 2 + 5)
                .attr("text-anchor", "end")
                .attr("fill", "#fefffb")
                .attr("font-size", "12px")
                .text(d => d.score.toFixed(2))
                .merge(ratings)
                    .transition()
                    .duration(1000)
                    .attr("x", d => x(d.score) - 5)
                    .attr("y", d => y(d.name) + y.bandwidth() / 2 + 5)
                    .text(d => d.score.toFixed(2));

            ratings.exit().remove();

            // Dynamically updated the chart title for each year
            // of the animation
            yearLabel.text(`Top Rated Anime (${year})`);
        }

        // Animation looping through 1985-2025
        // Maybe change timeout to make it faster
        function step() {
            if (yearIndex >= window.allYears.length) return;
            updateChart(window.allYears[yearIndex]);
            yearIndex++;
            setTimeout(step, 1500);
        }

        step();
    }
    else if (sceneNumber === 1) {
        // const margin = { top: 60, right: 20, bottom: 60, left: 80 };
        // const width = svg.node().getBoundingClientRect().width - margin.left - margin.right;
        // const height = svg.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const bounds = svg.node().getBoundingClientRect();

        const margin = {
            top: bounds.height * 0.1,
            right: bounds.width * 0.05,
            bottom: bounds.height * 0.1,
            left: bounds.width * 0.25
        };

        const width = 1200 - margin.left - margin.right;
        const height = 700 - margin.top - margin.bottom;


        // const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const g = svg.append("g")
            .attr("class", "sceneGroup")
            .style("opacity", 0)
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.transition().duration(500).style("opacity", 1);


        // Group by year
        const topPerYear = [];

        window.allYears.forEach(year => {
            const yearAnimes = window.animeData.filter(d => d.aired_year === year);
            const top10 = yearAnimes.sort((a, b) => d3.descending(a.score, b.score)).slice(0, 10);
            topPerYear.push(...top10);
        });

        // Set scales
        const x = d3.scaleLog()
            .base(10)
            .domain([
                d3.min(topPerYear, d => d.members) - 100,
                d3.max(topPerYear, d => d.members)
            ])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([d3.min(topPerYear, d => d.score) - 0.5, 10])
            .range([height, 0]);

        // Draw axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        g.append("g")
            .call(d3.axisLeft(y));

        // Plot data
        g.selectAll("circle")
            .data(topPerYear)
            .enter()
            .append("circle")
                .attr("cx", d => x(d.members))
                .attr("cy", d => y(d.score))
                .attr("r", 5)
                .attr("fill", "#2f51a3")
                .attr("opacity", 0.7)
                .on("mouseover", function (event, d) {
                    tooltip.transition().duration(200).style("opacity", 0.95);

                    // Offset the tooltip to appear bottom-right of the cursor
                    const offsetX = 10;
                    const offsetY = 290;

                    const left = event.pageX + offsetX;
                    const top = event.pageY - offsetY;

                    tooltip
                        .html(`
                            <strong>${d.name} (${d.aired_year})</strong><br/>
                            Rating: ${d.score}<br/>
                            Popularity: ${d.members.toLocaleString()}
                        `)
                        .style("left", `${left}px`)
                        .style("top", `${top}px`)
                        .style("position", "absolute");
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(200).style("opacity", 0);
                });


        // X label
        svg.append("text")
            .attr("x", margin.left + width / 2)
            .attr("y", height + margin.top + 40)
            .attr("text-anchor", "middle")
            .text("Popularity (Number of Users)");

        // Y label
        svg.append("text")
            .attr("transform", `translate(20, ${margin.top + height / 2}) rotate(-90)`)
            .attr("text-anchor", "middle")
            .text("Rating (Score)");

        // Set title
        svg.append("text")
            .attr("x", 600)
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "24px")
            .attr("font-weight", "bold")
            .attr("fill", "#444")
            .text("Rating vs Popularity of Top 10 Anime Per Year");

    }
    else if (sceneNumber === 2) {
        // const margin = { top: 80, right: 60, bottom: 60, left: 200 };
        // const width = svg.node().getBoundingClientRect().width - margin.left - margin.right;
        // const height = svg.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const bounds = svg.node().getBoundingClientRect();

        const margin = {
            top: bounds.height * 0.1,
            right: bounds.width * 0.05,
            bottom: bounds.height * 0.1,
            left: bounds.width * 0.25
        };

        const width = 1200 - margin.left - margin.right;
        const height = 700 - margin.top - margin.bottom;


        // const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const g = svg.append("g")
            .attr("class", "sceneGroup")
            .style("opacity", 0)
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.transition().duration(500).style("opacity", 1);


        // Get average score per genre
        const genreData = new Map();

        window.animeData.forEach(d => {
            if (!d.genres) return;
            const genres = d.genres.split(",").map(g => g.trim());

            genres.forEach(genre => {
                if (!genreData.has(genre)) {
                    genreData.set(genre, { totalScore: 0, count: 0 });
                }
                genreData.get(genre).totalScore += d.score;
                genreData.get(genre).count += 1;
            });
        });

        const genreAvg = Array.from(genreData, ([genre, { totalScore, count }]) => ({
            genre,
            avgScore: totalScore / count
        }));

        // Sort genres by average score
        genreAvg.sort((a, b) => d3.descending(a.avgScore, b.avgScore));

        // Set scales
        const x = d3.scaleLinear()
            .domain([0, d3.max(genreAvg, d => d.avgScore)])
            .range([0, width]);
        const y = d3.scaleBand()
            .domain(genreAvg.map(d => d.genre))
            .range([0, height])
            .padding(0.1);

        // Draw bars with growing animation
        g.selectAll("rect")
            .data(genreAvg)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", d => y(d.genre))
            .attr("height", y.bandwidth())
            .attr("width", 0)
            .attr("fill", "#2f51a3")
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", 0.95);

                tooltip.html(
                    `<strong>${d.genre}</strong><br/>
                    Average Score: ${d.avgScore.toFixed(2)}<br/>
                    Number of Animes: ${genreData.get(d.genre).count.toLocaleString()}`
                );
            })
            .on("mousemove", function(event) {
                const offsetX = 5;
                const offsetY = 280;

                const left = event.pageX + offsetX;
                const top = event.pageY - offsetY;

                tooltip
                    .style("left", `${left}px`)
                    .style("top", `${top}px`);
            })
            .on("mouseout", () => {
                tooltip.transition().duration(200).style("opacity", 0);
            })
            .transition()
                .duration(800)
                .delay((d, i) => i * 50)
                .attr("width", d => x(d.avgScore));

        // Add genre labels on left side
        g.selectAll("text.genreLabel")
            .data(genreAvg)
            .enter()
            .append("text")
            .attr("class", "genreLabel")
            .attr("x", -10)
            .attr("y", d => y(d.genre) + y.bandwidth() / 2 + 5)
            .attr("text-anchor", "end")
            .attr("font-size", "12px")
            .text(d => d.genre);

        // Add average score label inside bars
        g.selectAll("text.avgScore")
            .data(genreAvg)
            .enter()
            .append("text")
            .attr("class", "avgScore")
            .attr("x", d => x(d.avgScore) - 5)
            .attr("y", d => y(d.genre) + y.bandwidth() / 2 + 5)
            .attr("text-anchor", "end")
            .attr("fill", "white")
            .attr("font-size", "11px")
            .text(d => d.avgScore.toFixed(2));

        svg.append("text")
            .attr("x", 600)
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "24px")
            .attr("font-weight", "bold")
            .attr("fill", "#444")
            .text("Average Rating by Genre");
    }
    else if (sceneNumber === 3) {
        // const margin = { top: 80, right: 20, bottom: 60, left: 360 };
        // const width = svg.node().getBoundingClientRect().width - margin.left - margin.right;
        // const height = svg.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const bounds = svg.node().getBoundingClientRect();

        const margin = {
            top: bounds.height * 0.1,
            right: bounds.width * 0.05,
            bottom: bounds.height * 0.1,
            left: bounds.width * 0.25
        };

        const width = 1200 - margin.left - margin.right;
        const height = 700 - margin.top - margin.bottom;



        const g = svg.append("g")
            .attr("class", "sceneGroup")
            .style("opacity", 0)
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.transition().duration(500).style("opacity", 1);


        // Extract all genres from animeData
        const genreSet = new Set();
        window.animeData.forEach(d => {
            if (!d.genres) return;
            d.genres.split(",").map(g => g.trim()).forEach(g => genreSet.add(g));
        });
        const allGenres = Array.from(genreSet).sort();

        // Initially show the first genre
        if (selectedGenre == null) {
            selectedGenre = allGenres[0];
        }
        updateGenreChart(selectedGenre);

        // Populate dropdown and make it visible
        const selector = d3.select("#genreSelector");
        selector.style("display", "inline");
        selector.selectAll("option")
            .data(allGenres)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        // Listen for genre selection changes
        selector.on("change", function() {
            selectedGenre = this.value;
            updateGenreChart(selectedGenre);
        });

        function updateGenreChart(genre) {
            // Clear canvas
            g.selectAll("*").remove();

            // Filter anime in the selected genre
            const genreAnimes = window.animeData.filter(d =>
                d.genres && d.genres.split(",").map(g => g.trim()).includes(genre)
            );

            // Sort by score descending, take only top 10
            const top10 = genreAnimes.sort((a, b) => d3.descending(a.score, b.score)).slice(0,10);

            // Set scales
            const x = d3.scalePow()
                .exponent(3)
                .domain([0, d3.max(top10, d => d.score)])
                .range([0, width]);

            const y = d3.scaleBand()
                .domain(top10.map(d => d.name))
                .range([0, height])
                .padding(0.2);

            // Draw bars
            g.selectAll("rect")
                .data(top10)
                .enter()
                .append("rect")
                .attr("x", 0)
                .attr("y", d => y(d.name))
                .attr("height", y.bandwidth())
                .attr("width", 0)
                .attr("fill", "#2f51a3")
                .on("mouseover", function(event, d) {
                    tooltip.transition().duration(200).style("opacity", 0.95);

                    tooltip.html(
                        `<strong>${d.name}</strong><br/>
                        Score: ${d.score}<br/>
                        Year: ${d.aired_year}<br/>
                        Popularity: ${d.members.toLocaleString()}`
                    );
                })
                .on("mousemove", function(event) {
                    const offsetX = 5;
                    const offsetY = 300;

                    const left = event.pageX + offsetX;
                    const top = event.pageY - offsetY;

                    tooltip
                        .style("left", `${left}px`)
                        .style("top", `${top}px`);
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(200).style("opacity", 0);
                })
                .transition()
                    .duration(800)
                    .delay((d, i) => i * 50)
                    .attr("width", d => x(d.score));

            // Set labels
            g.selectAll("text.label")
                .data(top10)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("x", -10)
                .attr("y", d => y(d.name) + y.bandwidth() / 2 + 5)
                .attr("text-anchor", "end")
                .attr("font-size", "12px")
                .text(d => d.name);

            // Add ratings inside each bar
            g.selectAll("text.ratingScene4")
                .data(top10, d => d.name)
                .enter()
                .append("text")
                .attr("class", "ratingScene4")
                .attr("x", d => x(d.score) - 5)
                .attr("y", d => y(d.name) + y.bandwidth() / 2 + 5)
                .attr("text-anchor", "end")
                .attr("fill", "#fefffb")
                .attr("font-size", "12px")
                .text(d => d.score.toFixed(2));

            // Set title
            svg.selectAll(".scene4-title").remove();
            svg.append("text")
                .attr("class", "scene4-title")
                .attr("x", 600)
                .attr("y", 40)
                .attr("text-anchor", "middle")
                .attr("font-size", "24px")
                .attr("font-weight", "bold")
                .attr("fill", "#444")
                .text(`Top Rated Anime in Genre: ${genre}`);
        }
    }
}

// Consider adding a scrolling wheel transition, instead of buttons

function flashArrow(selector) {
    const arrow = d3.select(selector);
    arrow.classed("clicked", true);
    setTimeout(() => arrow.classed("clicked", false), 200);
}


d3.select("#navLeft").on("click", () => {
    if (currentScene > 0) {
        currentScene -= 1;
        flashArrow("#navLeft");
        renderScene(currentScene);
    }
    else {
        currentScene = totalScenes - 1;
        flashArrow("#navLeft");
        renderScene(currentScene);
    }
});

d3.select("#navRight").on("click", () => {
    if (currentScene < totalScenes - 1) {
        currentScene += 1;
        flashArrow("#navRight");
        renderScene(currentScene);
    }
    else {
        currentScene = 0;
        flashArrow("#navRight");
        renderScene(currentScene);
    }
});

window.addEventListener("resize", () => {
    svg.selectAll("*").remove();
    renderScene(currentScene);
});


// Previous Button Logic
// d3.select("#prevButton").on("click", () => {
//     if (currentScene > 0) {
//         currentScene -= 1;
//         renderScene(currentScene);
//     }
//     else {
//         currentScene = totalScenes - 1;
//         renderScene(currentScene);
//     }
// });

// // Next Button Logic
// d3.select("#nextButton").on("click", () => {
//     if (currentScene < totalScenes - 1) {
//         currentScene += 1;
//         renderScene(currentScene);
//     }
//     else {
//         currentScene = 0;
//         renderScene(currentScene);
//     }
// })