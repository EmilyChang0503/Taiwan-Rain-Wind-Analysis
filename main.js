let mapLeft = 0, mapTop = 0;
let mapMargin = {top: 30, right: 30, bottom: 30, left: 100},
    mapWidth = 1000 - mapMargin.left - mapMargin.right,
    mapHeight = 800 - mapMargin.top - mapMargin.bottom;

let barLeft = 1000, barTop = 400;
let barMargin = {top: 30, right: 30, bottom: 70, left: 50},
    barWidth = 1000 - barMargin.left - barMargin.right,
    barHeight = 500 - barMargin.top - barMargin.bottom;

let radarLeft = 1000, radarTop = 0;
let radarMargin = {top: 30, right: 30, bottom: 30, left: 30},
    radarWidth = 500 - radarMargin.left - radarMargin.right,
    radarHeight = 400 - radarMargin.top - radarMargin.bottom;

let infoLeft = 1500, infoTop = 0;
let infoMargin = {top: 30, right: 30, bottom: 30, left: 30},
    infoWidth = 500 - infoMargin.left - infoMargin.right,
    infoHeight = 400 - infoMargin.top - infoMargin.bottom;

let timeLeft = 200, timeTop = 850;
let timeMargin = {top: 30, right: 30, bottom: 30, left: 30},
    timeWidth = 600 - timeMargin.left - timeMargin.right,
    timeHeight = 100 - timeMargin.top - timeMargin.bottom;

var svg = d3.select('svg');

let mapSvg = svg.append('g')
    .attr('transform', `translate(${mapLeft}, ${mapTop})`);

mapSvg.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', mapWidth + mapMargin.left + mapMargin.right)
    .attr('height', mapHeight + mapMargin.top + mapMargin.bottom + 150)
    .attr('fill', 'gray')
    .attr('opacity', 0.3);
    
let barSvg = svg.append('g')
    .attr('transform', `translate(${barLeft}, ${barTop})`);

let radarSvg = svg.append('g')
    .attr('transform', `translate(${radarLeft}, ${radarTop})`);

let timeSvg = svg.append('g')
    .attr('transform', `translate(${timeLeft}, ${timeTop})`);

let infoSvg = svg.append('g')
    .attr('transform', `translate(${infoLeft}, ${infoTop})`);

var testData = [
    { country: '臺北市', month: '1', rainfall: 120, wind_direction: 120 },
    { country: '臺北市', month: '2', rainfall: 80, wind_direction: 80 },
    { country: '新北市', month: '1', rainfall: 10, wind_direction: 110 },
    { country: '新北市', month: '2', rainfall: 280, wind_direction: 70  },
    { country: '臺南市', month: '1', rainfall: 200, wind_direction: 100 },
    { country: '臺南市', month: '2', rainfall: 150, wind_direction: 50 },
    { country: '臺中市', month: '1', rainfall: 320, wind_direction: 90 },
    { country: '臺中市', month: '2', rainfall: 50, wind_direction: 50 }
];
    
Promise.all([
    d3.json('taiwan.json'),
    d3.csv('dataset/2023/wind_direction_daily.csv'),
    d3.json('dataset/city_data.json')
]).then(function([taiwanData, windir_data, cityData]) {
    //preprocess windir_data
    var windir_list_daily = [];
    windir_data.forEach(d => {
        var country = d.City;
        var month = d.Date[5] + d.Date[6];
        var wind_direction = d.Avg;
        windir_list_daily.push({ country: country, month: month, wind_direction: wind_direction });
    });

    //draw taiwan map
    var projection = d3.geoMercator()
                       .scale(10000)
                       .center([120.5,23.7])
                       .translate([mapWidth / 2, mapHeight / 2]);

    var geoGenerator = d3.geoPath()
                         .projection(projection);

    //select country 
    var selectedCountry = null;

    var country = mapSvg.selectAll('path')
        .data(taiwanData.features)
        .enter()
        .append('path')
        .attr('stroke', 'black')
        .attr('d', geoGenerator)
        .attr('class', 'country')
        .on('mouseover', function () {
            if(selectedCountry == this) return;
            d3.select(this).classed('country-hovered', true);
            // console.log(d3.select(this).data()[0].properties.NAME_2014);
            d3.select('.' + d3.select(this).data()[0].properties.NAME_2014).classed('country-hovered', true);
        })
        .on('mouseout', function () {
            d3.select(this).classed('country-hovered', false);
            d3.select('.' + d3.select(this).data()[0].properties.NAME_2014).classed('country-hovered', false);
        })
        .on('click', function () {
            if(selectedCountry == this) {
                d3.select(selectedCountry).classed('country-selected', false);
                d3.select('.' + d3.select(selectedCountry).data()[0].properties.NAME_2014).classed('country-selected', false)
                d3.select(this).classed('country-hovered', true);
                d3.select('.' + d3.select(this).data()[0].properties.NAME_2014).classed('country-hovered', true);
                selectedCountry = null;
                var monthlyData = processWindData(windir_list_daily, selectedMonth, selectedCountry);
                updateRadarChart(monthlyData);
                updateInfo(selectedCountry, selectedMonth);
                return;
            }
            if(selectedCountry) {
                d3.select(selectedCountry).classed('country-selected', false);
                d3.select('.' + d3.select(selectedCountry).data()[0].properties.NAME_2014).classed('country-selected', false)
            }
            selectedCountry = this;
            d3.select(this).classed('country-hovered', false).classed('country-selected', true);
            d3.select('.' + d3.select(this).data()[0].properties.NAME_2014).classed('country-hovered', false).classed('country-selected', true)

            var monthlyData = processWindData(windir_list_daily, selectedMonth, selectedCountry);
            updateRadarChart(monthlyData);

            updateInfo(selectedCountry, selectedMonth);
        });
    
    //select month
    var selectedMonth = 1;

    var months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    var timeXScale = d3.scalePoint()
        .domain(months)
        .range([0, timeMargin.left + timeWidth + timeMargin.right]);
    var timeXAxis = d3.axisBottom(timeXScale).tickSize(10);
    timeSvg.call(timeXAxis);

    timeSvg.append('text')
        .attr('x', -50)
        .attr('y', 7)
        .text('Month')
        .style('font-size', '16px')
        .style('fill', 'white');

    var dragCircle = timeSvg.append('circle')
        .attr('cx', timeXScale(selectedMonth))
        .attr('cy', 0)
        .attr('r', 10)
        .attr('fill', 'palegreen')
        .call(
            d3.drag()
                .on('drag', function() {
                    var x = Math.max(0, Math.min((d3.mouse(this))[0], timeWidth + timeMargin.left + timeMargin.right));
                    dragCircle.attr('cx', x);

                    var closestMonth = months.reduce((prev, curr) => {
                        return Math.abs(timeXScale(curr) - x) < Math.abs(timeXScale(prev) - x) ? curr : prev;
                    }, months[0]);

                    selectedMonth = closestMonth;
                })
                .on('end', function () {
                    var targetX = timeXScale(selectedMonth);
                    dragCircle.attr('cx', targetX);
                    
                    updateMap(selectedMonth);
                    
                    var monthlyData = processWindData(windir_list_daily, selectedMonth, selectedCountry);
                    var monthlyData = processWindData(windir_list_daily, selectedMonth, selectedCountry);
                    updateRadarChart(monthlyData);
                    draw_barchart(selectedMonth < 10 ? '0' + selectedMonth : selectedMonth);

                    updateInfo(selectedCountry, selectedMonth);
                })
        );

    //update taiwan map

    function updateMap(selectedMonth) {
        var str_month = selectedMonth < 10 ? '0' + selectedMonth : selectedMonth;
        rainfall_list = [];
        for (var country_ in cityData.rainfall[str_month]) {
            var city = country_;
            var sum = cityData.rainfall[str_month][country_];
            var existing = rainfall_list.find(d => d.city === city);
            if (existing) {
                existing.sum += sum;
            } else {
                rainfall_list.push({ country: city, rainfall: sum });
            }
        }

        var colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
            .domain([0, d3.max(rainfall_list, d => d.rainfall)]);

        var colorBarWidth = 20;
        var colorBarHeight = 300;

        var colorBarScale = d3.scaleLinear()
            .domain([0, d3.max(rainfall_list, d => d.rainfall)])
            .range([colorBarHeight, 0]);

        var colorBarAxis = d3.axisLeft(colorBarScale)
            .ticks(5);

        svg.selectAll('.color-bar').remove(); // Reset the color bar

        var colorBar = svg.append('g')
            .attr('class', 'color-bar')
            .attr('transform', `translate(${mapLeft + mapMargin.left - 30}, ${mapTop + mapHeight - colorBarHeight})`);

        colorBar.selectAll('rect')
            .data(d3.range(0, colorBarHeight))
            .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', d => d)
            .attr('width', colorBarWidth)
            .attr('height', 1)
            .attr('fill', d => colorScale(colorBarScale.invert(d)));

        colorBar.append('g')
            .attr('transform', `translate(0, 0)`)
            .call(colorBarAxis);

        colorBar.append('text')
            .attr('x', -40)
            .attr('y', -20)
            .attr('text-anchor', 'start')
            .style('font-size', '14px')
            .style('fill', 'white')
            .text('precipitation(mm)');

        var rainfallMap = {};
        rainfall_list.forEach(d => {
            rainfallMap[d.country] = d.rainfall;
        });

        country.attr('fill', function (d) {
            var rainfall = rainfallMap[d.properties.NAME_2014] || 0;
            return colorScale(rainfall);
        });
    }

    updateMap(selectedMonth);
    
    //discretization
    function processWindData(data, selectedMonth, selectedCountry) {

        var filteredData = data.filter(d => d.month == selectedMonth);
        if(selectedCountry) {
            countryName = d3.select(selectedCountry).data()[0].properties.NAME_2014;
            filteredData = filteredData.filter(d => d.country == countryName);
        }

        var binSize = 360/16;
        var bins = d3.range(0, 360, binSize);

        var binCounts = bins.map(bin => ({ angle: bin, frequency: 0 }));

        filteredData.forEach(d => {
            var angle = d.wind_direction;
            var binIndex = Math.floor(angle / binSize);
            (binCounts[binIndex]).frequency += 1;
        });

        var total = d3.sum(binCounts, d => d.frequency);
        binCounts.forEach(d => {
            d.frequency = total > 0 ? d.frequency / total : 0;
        });

        return binCounts;
    }

    //draw radar chart
    var radarRadius = Math.min(radarWidth, radarHeight) / 2;
    var angleScale = d3.scaleLinear().domain([0, 360]).range([0, 2 * Math.PI]);
    var radiusScale = d3.scaleLinear().domain([0, 1]).range([0, radarRadius]);

    var gridLevels = d3.range(0.2, 1.2, 0.2);
    radarSvg.selectAll('.grid')
        .data(gridLevels)
        .enter()
        .append('circle')
        .attr('class', 'grid')
        .attr('cx', radarWidth/2 + radarMargin.left)
        .attr('cy', radarHeight/2 + radarMargin.top)
        .attr('r', d => radiusScale(d));

    var directions = d3.range(0, 360, 15);
    radarSvg.selectAll(".axis")
        .data(directions)
        .enter()
        .append("line")
        .attr("class", "axis")
        .attr('transform', `translate(${radarWidth/2 + radarMargin.left}, ${radarHeight/2 + radarMargin.top})`)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", d => radiusScale(1) * Math.cos(angleScale(d) - Math.PI / 2))
        .attr("y2", d => radiusScale(1) * Math.sin(angleScale(d) - Math.PI / 2))
        .style("stroke", "#aaa");

    var directions = d3.range(0, 360, 360/16);
    var directionLabels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

    radarSvg.selectAll('.radar-label')
        .data(directions)
        .enter()
        .append('text')
        .attr('transform', `translate(${radarWidth/2 + radarMargin.left}, ${radarHeight/2 + radarMargin.top + 7})`)
        .attr('class', 'radar-label')
        .attr('x', d => radiusScale(1.1) * Math.cos(angleScale(d) - Math.PI / 2))
        .attr('y', d => radiusScale(1.1) * Math.sin(angleScale(d) - Math.PI / 2))
        .attr('text-anchor', 'middle')
        .text((d, i) => directionLabels[i]);

    //update radar chart
    function updateRadarChart(data) {
        var areaGenerator = d3.lineRadial()
            .angle(d => angleScale(d.angle))
            .radius(d => radiusScale(d.frequency) * 1.5)
            .curve(d3.curveCardinalClosed);
    
        var radarPath = radarSvg.selectAll('.radar-area').data([data]);
    
        radarPath.enter()
            .append('path')
            .attr('transform', `translate(${radarWidth/2 + radarMargin.left}, ${radarHeight/2 + radarMargin.top})`)
            .attr('class', 'radar-area')
            .merge(radarPath)
            .transition()
            .duration(500)
            .attr('d', areaGenerator)
            .attr('fill', 'orange')
            .attr('fill-opacity', 0.7)
            .attr('stroke', 'orange')
            .attr('stroke-width', 2);
    
        radarPath.exit().remove();
    }
    
    var windir_list = [];
    for (var month in cityData.wind_direction) {
        for (var country_ in cityData.wind_direction[month]) {
            windir_list.push({
                country: country_,
                month: month,
                wind_direction: cityData.wind_direction[month][country_]
            });
        }
    }

    var monthlyData = processWindData(windir_list_daily, selectedMonth);
    updateRadarChart(monthlyData);

    function updateInfo(selectedCountry, selectedMonth) {
        infoSvg.selectAll('*').remove();

        var countryName = selectedCountry ? d3.select(selectedCountry).data()[0].properties.NAME_2014 : '全國';
        var rainfallData, windData;

        windData = processWindData(windir_list_daily, selectedMonth, selectedCountry);
        let maxFreqAngle = windData.find(d => d.frequency === d3.max(windData, d => d.frequency)).angle;
        let dir = directionLabels[Math.floor(maxFreqAngle / 22.5)];
        console.log(dir);

        var str_month = selectedMonth < 10 ? '0' + selectedMonth : selectedMonth;
        if(selectedCountry) {
            rainfallData = cityData.rainfall[str_month][countryName];
        } else {
            var filteredData = cityData.rainfall[str_month];
            var totalRainfall = 0;
            for (var city in filteredData) {
                totalRainfall += filteredData[city];
            }
            console.log(totalRainfall);
            rainfallData = totalRainfall;
        }


        var infoData = [
            {Country: countryName},
            {Month: selectedMonth},
            {Rainfall: rainfallData ? rainfallData.toFixed(1) : 'N/A'},
            {WindDirection: dir ? dir : 'N/A'}
        ];

        infoSvg.append('text')
            .attr('x', infoMargin.left)
            .attr('y', infoMargin.top)
            .text('Country')
            .style('font-size', '30px')
            .style('fill', 'lightcoral');

        infoSvg.append('text')
            .attr('x', infoMargin.left + 30)
            .attr('y', infoMargin.top + 70)
            .text(`${infoData[0].Country}`)
            .transition()
            .duration(500)
            .style('font-size', '60px')
            .style('fill', 'lightcoral');

        infoSvg.append('text')
            .attr('x', infoWidth/2 + 70)
            .attr('y', infoMargin.top)
            .text('Month')
            .style('font-size', '30px')
            .style('fill', 'palegreen');

        infoSvg.append('text') 
            .attr('x', infoWidth/2 + 100)
            .attr('y', infoMargin.top + 70)
            .text(`${infoData[1].Month}`)
            .transition()
            .duration(500)
            .style('font-size', '60px')
            .style('fill', 'palegreen');

        infoSvg.append('text')
            .attr('x', infoMargin.left)
            .attr('y', infoHeight / 2)
            .text('Rainfall')
            .style('font-size', '30px')
            .style('fill', 'steelblue');

        infoSvg.append('text')
            .attr('x', infoMargin.left + 150)
            .attr('y', infoHeight / 2 + 50)
            .text(infoData[2].Rainfall)
            .transition()
            .duration(500)
            .style('font-size', '100px')
            .style('fill', 'steelblue');

        infoSvg.append('text')
            .attr('x', infoMargin.left)
            .attr('y', infoHeight - infoMargin.bottom)
            .text('WindDirection')
            .style('font-size', '30px')
            .style('fill', 'orange');

        infoSvg.append('text')
            .attr('x', infoMargin.left + 200)
            .attr('y', infoHeight - infoMargin.bottom + 50)
            .text(infoData[3].WindDirection)
            .transition()
            .duration(500)
            .style('font-size', '100px')
            .style('fill', 'orange');
    }

    updateInfo(selectedCountry, selectedMonth);

    // draw bar chart
    function draw_barchart(month=0) {
        if (month != 0) {
            rainfall_list = [];
            for (var country_ in cityData.rainfall[month]) {
                var city = country_;
                var sum = cityData.rainfall[month][country_];
                var existing = rainfall_list.find(d => d.city === city);
                if (existing) {
                    existing.sum += sum;
                } else {
                    rainfall_list.push({ city: city, sum: sum });
                }
            }
        }

        // Sort the rainfall_list by sum
        rainfall_list.sort((a, b) => b.sum - a.sum);

        var barXScale = d3.scaleBand()
            .domain(rainfall_list.map(d => d.city))
            .range([0, barWidth])
            .padding(0.1);

        var barYScale = d3.scaleLinear()
            .domain([0, d3.max(rainfall_list.map(d => d.sum))])
            .range([barHeight, 0]);

        var barXAxis = d3.axisBottom(barXScale);
        var barYAxis = d3.axisLeft(barYScale);

        barSvg.selectAll('.x-axis').remove();
        barSvg.selectAll('.y-axis').remove();

        barSvg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(${barMargin.left}, ${barHeight + barMargin.top})`)
            .call(barXAxis)
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .attr('y', 10)
            .attr('x', -5)
            .attr('text-anchor', 'end')
            .style('font-size', '18px');

        barSvg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${barMargin.left}, ${barMargin.top})`)
            .call(barYAxis);

        var bar = barSvg.selectAll('.rect').data(rainfall_list, d => d.city);

        bar.enter()
            .append('rect')
            .attr('class', d => `rect ${d.city}`)
            .attr('x', d => barXScale(d.city) + barMargin.left)
            .attr('y', barHeight + barMargin.top)
            .attr('width', barXScale.bandwidth())
            .attr('height', 0)
            .attr('fill', 'steelblue')
            .merge(bar)
            .transition()
            .duration(1000)
            .attr('x', d => barXScale(d.city) + barMargin.left)
            .attr('y', d => barYScale(d.sum) + barMargin.top)
            .attr('height', d => barHeight - barYScale(d.sum));

        bar.exit().remove();
    }

    draw_barchart('01');

});