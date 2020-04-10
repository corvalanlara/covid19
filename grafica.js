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
		cuarentena: 0,
		sri_treinta: 0,
		sri_cuarentena: 0,
		sri: 0,
		exponencial: 0,
	},
	created() {
		let este = this;
		var csv = d3.csv("datos.csv" , 
			function(d) {
				return { 
					fecha: d3.timeParse("%Y-%m-%d")(d.fecha), 
					total: Number(d.contagiados_a),
					indice: Number(d.indice),
					retirados: Number(d.retirados_a),
					infectados: Number(d.infectados_v),
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
			var c = 10**pend;
			este.treinta = Math.round(contagiados_hoy * c**30);
			este.exponencial = Math.round(contagiados_hoy * c);
			este.mensaje = contagiados_hoy;
			var k = c - 1;
			var mitad_k = k / 2;
			var nuevo_c = mitad_k + 1;
			este.cuarentena = Math.round(contagiados_hoy * nuevo_c ** 30);
			este.sri = sri(da, k).contagiados;
			var lvirtual = add_virtual_dates(da, k, 30);
			este.sri_treinta = lvirtual[lvirtual.length - 1].contagiados;
			var vcuarentena = add_virtual_dates(da, mitad_k, 30);
			este.sri_cuarentena = vcuarentena[vcuarentena.length - 1].contagiados;
			console.log(vcuarentena);
			console.log(lvirtual);
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

	return m;
}

function sri(data, k) {
	const totalpais = 19107216;
	const d = 14;
	var data_hoy = data[data.length - 1];
	var r = data_hoy.retirados;
	var i = data_hoy.infectados;
	var sanos = totalpais - i - r;
	var rd = data[data.length - d].retirados;
	var rd_1 = data[data.length - d + 1].retirados;
	var r_proy = r + rd - rd_1;
	var i_proy = i + ((k * sanos) / totalpais) * i - (r_proy - r);
	var contagiados_proy = r_proy + i_proy;
	return { 
		contagiados: Math.round(contagiados_proy),
		infectados: Math.round(i_proy),
		retirados: Math.round(r_proy),
	};	
}

function add_virtual_dates(da, k, num) {
	var virtual = [...da];
	for(var i = 0; i < num; i++) {
		virtual.push(sri(virtual, k));
	};
	return virtual;
}
