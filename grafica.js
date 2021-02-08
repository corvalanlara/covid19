const totalpais = 19107216;
const d = 14;
const formato = {year: 'numeric', month: 'long', day: 'numeric'};

function draw(data, columna) {
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


	var x = d3.scaleTime()
		.domain(d3.extent(data, function(d) { return d.fecha; }))
		.range([0, width]);
	
	var max_y1 = d3.max(data, function(d) { return d[columna]; });

	var y = d3.scaleLinear()
		.domain([0, max_y1])
		.range([height, 0]);

	var line = d3.line()
		.x(function(d) {
			return x(d.fecha);
		})
		.y(function(d) {
			return y(d[columna]);
		});

	var line2 = d3.line()
		.x(function(d) {
			return x(d.fecha);
		})
		.y(function(d) {
			return y(d[columna]);
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
		.text("Total de " + columna);


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
		.data(data)
		.enter().append("circle")
		.attr("r", 5)
		.attr("cx", function(d) { return x(d.fecha); })
		.attr("cy", function(d) { return y(d[columna]); })
		.on("mouseover", function(c) {
			tooltip.style("opacity", 1)
				.html(c[columna] + " " + columna + " al día " + c.fecha.toLocaleDateString('es-CL', formato));
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
		sri_treinta: 0,
		fecha_pronostico: "",
		total_hoy: 0,
		fecha_hoy: "",
	},
	created() {
		let este = this;
		var csv = d3.csv("https://raw.githubusercontent.com/MinCiencia/Datos-COVID19/master/output/producto5/TotalesNacionales.csv").then(function(e) {
			var transposed = [];
			e.forEach(function(c) {
				transposed.push(Object.values(c));
			});
			transposed.push(Object.keys(e[1]));
			var keys = d3.transpose(transposed);
			var values = keys.splice(1);

			var objetos = []
			for(var i = 0; i < values.length; i++) {
				var o = {}
				for(var j = 0; j < keys[0].length; j++) {
					o[keys[0][j]] = values[i][j];
				}
				objetos.push(o);
			}
			objetos.forEach(function(e, i) {
				e["retirados"] = Number(e["Fallecidos"]) + Number(e["Casos recuperados"]);
				e["infectados"] = (Number(e["Casos totales"]) - Number(e["retirados"]));
				e["indice"] = i + 1;
				e["fecha"] = d3.timeParse("%Y-%m-%d")(e["Fecha"]);
				e["contagiados"] = Number(e["Casos totales"]);

			
			});
			return objetos;
		});
		
		csv.then(function(da) {
			//Último dato
			var ultimo = da[da.length - 1];
			este.fecha_hoy = ultimo.fecha.toLocaleDateString('es-CL', formato);
			este.total_hoy = ultimo.contagiados;

			//Método SRI
			var lvirtual = add_virtual_dates(da, 30, false);
			este.sri_treinta = lvirtual[lvirtual.length - 1].contagiados; 

			//Fechas
			este.fecha_pronostico = lvirtual[lvirtual.length - 1].fecha.toLocaleDateString('es-CL', formato);
			
			//Gráfico
			draw(lvirtual, "contagiados");
		});
	},
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
		infectados: Math.round(i_proy) >= 0 ? Math.round(i_proy) : 0,
		retirados: Math.round(r_proy),
		fecha: nueva_fecha,
	};	
}

function add_virtual_dates(da, num, quarantine) {
	var virtual = [...da];
	var k = quarantine ? (get_k(da) / 3) : get_k(da);
	for(var i = 0; i < num; i++) {
		virtual.push(sri(virtual, k));
	};
        return virtual;
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
