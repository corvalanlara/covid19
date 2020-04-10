var svgWidth = 600;
var svgHeight = 400;
var margin = {top: 20, right: 20, bottom: 30, left: 50};
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;
var svg = d3.select("#dataviz")
		.append("svg")
		.attr("width", svgWidth)
		.attr("height", svgHeight)
		.append("g")
		.attr("transform", 
			"translate(" + margin.left + "," + margin.top + ")" );


function draw(data) {
	var x = d3.scaleTime()
		.domain(d3.extent(data, function(d) { return d.fecha; }))
		.range([0, width]);

	var y = d3.scaleLinear()
		.domain([0, d3.max(data, function(d) { return +d.total; })])
		.range([height, 0]);

	var line = d3.line()
		.x(function(d) {
			return x(d.fecha)
		})
		.y(function(d) {
			return y(d.total)
		});

	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	svg.append("g")
		.call(d3.axisLeft(y))
		.append("text")
		.attr("fill", "#000")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", "0.71em")
		.attr("text-anchor", "end")
		.text("Total de contagiados");

	svg.selectAll("dot")
		.data(data)
		.enter().append("circle")
		.attr("r", 3.5)
		.attr("cx", function(d) { return x(d.fecha); })
		.attr("cy", function(d) { return y(d.total); })
		.on("mouseover", function(c) {
			svg.select('[cx="'+ x(c.fecha) + '"]')
				.style("fill", "red");
		})
		.on("mouseout", function(c) {
			svg.select('[cx="'+ x(c.fecha) + '"]')
				.style("fill", "black");
		});

	svg.append("path")
		.datum(data)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", line);
}

var app = new Vue({
	el: '#pro',
	data: {
		mensaje: 0,
		treinta: 0,
	},
	created() {
		let este = this;
		var csv = d3.csv("datos.csv" , 
			function(d) {
				return { 
					fecha: d3.timeParse("%Y-%m-%d")(d.fecha), 
					total: Number(d.contagiados_a),
					indice: Number(d.indice),
				};
			}
		);

		csv.then(function(da) {
			draw(da);
			contagiados_hoy = da[da.length - 1].total;
			var ultimos = da.slice(-7);
			var indices = ultimos.map((a) => a.indice);
			var contagiados = ultimos.map((a) => a.total);
			var pend = pendiente(indices, contagiados);
			este.treinta = Math.round(contagiados_hoy * pend**30);
			este.mensaje = contagiados_hoy;
		});
	}
});

// METODO DE MÍNIMOS CUADRADOS
function pendiente(dias, contagiados) {
	var log = contagiados.map((a) => Math.log10(a));
	var numero = dias.length;
	var suma_x = dias.reduce((t, a) => t + a, 0);
	var suma_y = log.reduce((t, a) => t + a, 0);
	var suma_xx = dias.reduce((t, a) => t + a*a, 0);
	var suma_xy = dias.reduce((r, a, i) => r + a * log[i], 0)

	var numer = numero * suma_xy - suma_x * suma_y;
	var denom = numero * suma_xx - suma_x * suma_x;

	m = numer / denom;

	return 10**m;
}
