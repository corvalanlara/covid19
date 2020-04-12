
const totalpais = 19107216;
const d = 14;

var svgWidth = 600;
var svgHeight = 480;
var margin = {top: 20, right: 20, bottom: 30, left: 50};
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;
var svg = d3.select("#dataviz")
		.append("svg")
  		.attr("preserveAspectRatio", "xMinYMin meet")
  		.attr("viewBox", "0 0 600 480")
		.append("g")
		.attr("transform", 
			"translate(" + margin.left + "," + margin.top + ")" );


function draw(data) {
	console.log(data);
	var x = d3.scaleTime()
		.domain(d3.extent(data[0], function(d) { return d.fecha; }))
		.range([0, width]);
	
	var max_y1 = d3.max(data[0], function(d) { return d.infectados; });
	var max_y2 = d3.max(data[1], function(d) { return d.infectados; });

	var y = d3.scaleLinear()
		.domain([0, max_y1 > max_y2 ? max_y1 : max_y2])
		.range([height, 0]);

	var line = d3.line()
		.x(function(d) {
			return x(d.fecha);
		})
		.y(function(d) {
			return y(d.infectados);
		});

	var line2 = d3.line()
		.x(function(d) {
			return x(d.fecha);
		})
		.y(function(d) {
			return y(d.infectados);
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
		.text("Total de infectados");


	var tooltip = d3.select("#dataviz")
		.append("div")
		.style("opacity", 0)
		.attr("class", "tooltip")
		.style("background-color", "white")
		.style("border", "solid")
		.style("border-width", "1px")
		.style("border-radius", "5px")
		.style("padding", "10px")

	//DATOS SIN CUARENTENA
	svg.selectAll("dot")
		.data(data[0])
		.enter().append("circle")
		.attr("r", 5)
		.attr("cx", function(d) { return x(d.fecha); })
		.attr("cy", function(d) { return y(d.infectados); })
		.on("mouseover", function(c) {
			tooltip.style("opacity", 1)
				.html(c.infectados + " infectados al día " + c.fecha.toLocaleDateString());
			svg.select('[cx="'+ x(c.fecha) + '"]')
				.style("fill", "red");
		})
		.on("mouseout", function(c) {
			tooltip.transition()
				.duration(200)
				.style("opacity", 0);
			svg.select('[cx="'+ x(c.fecha) + '"]')
				.style("fill", "black");
		});

	svg.append("path")
		.datum(data[0])
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", line);

	// DATOS CUARENTENA
	svg.selectAll("dot")
		.data(data[1])
		.enter().append("circle")
		.attr("r", 5)
		.attr("cx", function(d) { return x(d.fecha); })
		.attr("cy", function(d) { return y(d.infectados); })
		.on("mouseover", function(c) {
			tooltip.style("opacity", 1)
				.html(c.infectados + " infectados al día " + c.fecha.toLocaleDateString());
			svg.select('[cx="'+ x(c.fecha) + 'a"]')
				.style("fill", "red");
		})
		.on("mouseout", function(c) {
			tooltip.transition()
				.duration(200)
				.style("opacity", 0);
			svg.select('[cx="'+ x(c.fecha) + 'a"]')
				.style("fill", "black");
		});

	svg.append("path")
		.datum(data[1])
		.attr("fill", "none")
		.attr("stroke", "red")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", line2);

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
					contagiados: Number(d.contagiados_a),
					indice: Number(d.indice),
					retirados: Number(d.retirados_a),
					infectados: Number(d.infectados_v),
				};
			}
		);

		csv.then(function(da) {
			contagiados_hoy = da[da.length - 1].contagiados;
			este.mensaje = contagiados_hoy;

			//Método exponencial
			var k = get_k(da);
			var c = k + 1;
			este.treinta = Math.round(contagiados_hoy * c**30);
			este.exponencial = Math.round(contagiados_hoy * c);
			var nuevo_k = k / 3;
			var nuevo_c = nuevo_k + 1;
			este.cuarentena = Math.round(contagiados_hoy * nuevo_c ** 30);

			//Método SRI
			este.sri = sri(da, k).contagiados;
			var lvirtual = add_virtual_dates(da, 30, false);
			este.sri_treinta = lvirtual[lvirtual.length - 1].contagiados;
			var vcuarentena = add_virtual_dates(da, 30, true);
			este.sri_cuarentena = vcuarentena[vcuarentena.length - 1].contagiados;

			var lvirtual120 = add_virtual_dates(da, 120, false);
			var vcuarentena120 = add_virtual_dates(da, 120, true);
			
			draw([lvirtual120, vcuarentena120]);
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
	var data_hoy = data[data.length - 1];
	var indice = data_hoy.indice;
	var fecha = data_hoy.fecha;
	var nueva_fecha = new Date(fecha);
	nueva_fecha.setDate(fecha.getDate() + 1);
	var r = data_hoy.retirados;
	var i = data_hoy.infectados;
	var sanos = totalpais - i - r;
	var rd = data[data.length - d].retirados;
	var rd_1 = data[data.length - d - 1].retirados;
	var r_proy = r + rd - rd_1;
	var i_proy = i + ((k * sanos) / totalpais) * i - (r_proy - r);
	var contagiados_proy = r_proy + i_proy;
	return { 
		indice: indice + 1,
		contagiados: Math.round(contagiados_proy),
		infectados: Math.round(i_proy),
		retirados: Math.round(r_proy),
		fecha: nueva_fecha,
	};	
}

function add_virtual_dates(da, num, quarantine) {
	var virtual = [...da];
	for(var i = 0; i < num; i++) {
		var k = quarantine ? (get_k(virtual) / 3) : get_k(virtual);
		virtual.push(sri(virtual, k));
	};
	var masdatos = get_infectados_al_dia(virtual);
        return masdatos;
}

function get_k(data) {
	var ultimos = data.slice(-7);
        var indices = ultimos.map((a) => a.indice);
        var contagiados = ultimos.map((a) => a.contagiados);
        var pend = pendiente(indices, contagiados);
        var c = 10**pend;
        var k = c - 1;
	return k;
}

function get_infectados_al_dia(data) {
	var lista = [...data];
	lista[0].infectados_dia = 0;
	for(var i = 1; i < lista.length; i++) {
		var infectados_hoy = lista[i].infectados;
		var infectados_ayer = lista[i - 1].infectados;
		lista[i].infectados_dia = infectados_hoy - infectados_ayer;
	}
	return lista;
}
