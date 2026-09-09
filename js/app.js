(function () {
  "use strict";

  var DATA_URL = "data/excursiones.json";

  var data = null;
  var excursionesById = {};
  var propuestaActual = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    document.getElementById("anio").textContent = new Date().getFullYear();
    setupModal();
    setupAgenciasModal();
    setupFilters();
    setupArmadorForm();
    cargarDatos();
  }

  // ===================== CARGA DE DATOS =====================

  function cargarDatos() {
    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("No se pudo cargar " + DATA_URL);
        return res.json();
      })
      .then(function (json) {
        data = json;
        excursionesById = {};
        data.excursiones.forEach(function (ex) { excursionesById[ex.id] = ex; });
        renderExcursiones("todas");
        renderContacto();
      })
      .catch(function (err) {
        var list = document.getElementById("excursiones-list");
        list.innerHTML = '<p class="armador-mensaje">No se pudieron cargar los datos (' + escapeHtml(err.message) + '). Si estás abriendo el archivo directamente (file://), usá un servidor local.</p>';
        console.error(err);
      });
  }

  // ===================== HELPERS =====================

  function formatoMoneda(n) {
    if (n === null || n === undefined) return "—";
    return "$" + Math.round(n).toLocaleString("es-AR");
  }

  function capitalizar(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  // ===================== EXCURSIONES =====================

  function setupFilters() {
    var filters = document.getElementById("filters");
    filters.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      filters.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      renderExcursiones(btn.dataset.filter);
    });
  }

  function renderExcursiones(filtro) {
    if (!data) return;
    var list = document.getElementById("excursiones-list");
    list.innerHTML = "";
    var excursiones = data.excursiones.filter(function (ex) {
      return filtro === "todas" || ex.categoria === filtro;
    });
    excursiones.forEach(function (ex) {
      list.appendChild(crearTarjetaExcursion(ex));
    });
  }

  function crearTarjetaExcursion(ex) {
    var card = document.createElement("div");
    card.className = "excursion-card";
    card.tabIndex = 0;
    card.addEventListener("click", function () { mostrarDetalle(ex.id); });

    var badge = ex.categoria === "dia-completo" ? "Día completo" : "Medio día";

    var promoHtml = "—";
    if (ex.precios.promo) {
      promoHtml = '<span class="precio-item__valor promo">' + formatoMoneda(ex.precios.promo.precio) + '</span>';
    }

    var tarjetaHtml = "";
    if (ex.precios.tarjeta && ex.precios.tarjeta.precio) {
      tarjetaHtml = formatoMoneda(ex.precios.tarjeta.precio);
      if (ex.precios.tarjeta.cuotas) tarjetaHtml += ' (' + ex.precios.tarjeta.cuotas + ' cuotas)';
    } else {
      tarjetaHtml = "—";
    }

    card.innerHTML =
      '<div class="excursion-card__top">' +
        '<div class="excursion-card__nombre">' + escapeHtml(ex.nombre) + '</div>' +
        '<div class="excursion-card__badge">' + badge + '</div>' +
      '</div>' +
      '<div class="excursion-card__meta">' + escapeHtml(ex.salidas) + ' · ' + escapeHtml(ex.horario) + '</div>' +
      '<div class="excursion-card__precios">' +
        '<div class="precio-item"><span class="precio-item__label">Efectivo/Transf.</span><span class="precio-item__valor">' + formatoMoneda(ex.precios.efectivo_transferencia) + '</span></div>' +
        '<div class="precio-item"><span class="precio-item__label">Promo</span>' + promoHtml + '</div>' +
        '<div class="precio-item"><span class="precio-item__label">Tarjeta</span><span class="precio-item__valor">' + tarjetaHtml + '</span></div>' +
      '</div>';

    return card;
  }

  // ===================== MODAL =====================

  function setupModal() {
    document.getElementById("modal-backdrop").addEventListener("click", cerrarModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") cerrarModal();
    });
  }

  function cerrarModal() {
    document.getElementById("detalle-modal").hidden = true;
  }

  // ===================== ACCESO AGENCIAS =====================

  var CLAVE_AGENCIAS = "sarmiento231";
  var URL_AGENCIAS = "https://danielcadile-eng.github.io/tarifario-campo-base/";

  function setupAgenciasModal() {
    var modal = document.getElementById("agencias-modal");
    var form = document.getElementById("agencias-form");
    var claveInput = document.getElementById("agencias-clave");
    var error = document.getElementById("agencias-error");

    document.getElementById("acceso-agencias-link").addEventListener("click", function (e) {
      e.preventDefault();
      error.hidden = true;
      form.reset();
      modal.hidden = false;
      claveInput.focus();
    });

    document.getElementById("agencias-modal-backdrop").addEventListener("click", cerrarAgenciasModal);
    document.getElementById("agencias-modal-close").addEventListener("click", cerrarAgenciasModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) cerrarAgenciasModal();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (claveInput.value === CLAVE_AGENCIAS) {
        window.location.href = URL_AGENCIAS;
      } else {
        error.hidden = false;
      }
    });
  }

  function cerrarAgenciasModal() {
    document.getElementById("agencias-modal").hidden = true;
  }

  function mostrarDetalle(id) {
    var ex = excursionesById[id];
    if (!ex) return;

    var lista = function (arr, vacio) {
      if (!arr || arr.length === 0) return '<p>' + (vacio || "—") + '</p>';
      return '<ul>' + arr.map(function (i) { return '<li>' + escapeHtml(i) + '</li>'; }).join("") + '</ul>';
    };

    var promoTxt = ex.precios.promo
      ? formatoMoneda(ex.precios.promo.precio) + ' (' + ex.precios.promo.dias.map(capitalizar).join(", ") + ')'
      : "Sin promoción";

    var extrasHtml = "";
    if (ex.extras_opcionales && ex.extras_opcionales.length) {
      extrasHtml = '<h4>Extras opcionales</h4><ul>' + ex.extras_opcionales.map(function (x) {
        return '<li>' + escapeHtml(x.nombre) + ' — ' + formatoMoneda(x.precio) + '</li>';
      }).join("") + '</ul>';
    }

    var notasHtml = "";
    if (ex.notas && ex.notas.length) {
      notasHtml = '<h4>Notas</h4>' + lista(ex.notas);
    }

    var tarjetaHtml = ex.precios.tarjeta && ex.precios.tarjeta.precio ? formatoMoneda(ex.precios.tarjeta.precio) : "—";

    var content = document.getElementById("modal-content");
    content.innerHTML =
      '<button class="modal-close" aria-label="Cerrar">&times;</button>' +
      '<h3>' + escapeHtml(ex.nombre) + '</h3>' +
      '<p>' + escapeHtml(ex.salidas) + ' · ' + escapeHtml(ex.horario) + (ex.duracion_horas ? ' · ' + ex.duracion_horas + ' hs' : '') + '</p>' +
      (ex.pickup ? '<p><strong>Pickup:</strong> ' + escapeHtml(ex.pickup) + '</p>' : '') +
      '<h4>Recorrido</h4>' + lista(ex.recorrido) +
      '<h4>Incluye</h4>' + lista(ex.incluye, "No especificado") +
      '<h4>No incluye</h4>' + lista(ex.no_incluye, "Nada adicional") +
      extrasHtml + notasHtml +
      '<div class="modal-precios">' +
        '<div class="precio-item"><span class="precio-item__label">Efectivo/Transf.</span><span class="precio-item__valor">' + formatoMoneda(ex.precios.efectivo_transferencia) + '</span></div>' +
        '<div class="precio-item"><span class="precio-item__label">Promo</span><span class="precio-item__valor promo">' + promoTxt + '</span></div>' +
        '<div class="precio-item"><span class="precio-item__label">Tarjeta</span><span class="precio-item__valor">' + tarjetaHtml + '</span></div>' +
      '</div>';

    content.querySelector(".modal-close").addEventListener("click", cerrarModal);
    document.getElementById("detalle-modal").hidden = false;
  }

  // ===================== CONTACTO =====================

  function renderContacto() {
    var ag = data.agencia;
    var el = document.getElementById("contacto-info");
    el.innerHTML =
      '<p><strong>' + escapeHtml(ag.nombre) + '</strong></p>' +
      '<p>' + escapeHtml(ag.direccion) + '</p>' +
      '<p>WhatsApp: <a href="https://wa.me/' + ag.whatsapp.replace(/\D/g, '') + '">' + escapeHtml(ag.whatsapp) + '</a></p>' +
      '<p>Instagram: ' + escapeHtml(ag.instagram) + '</p>';
  }

  // ===================== HELPERS DÍAS =====================

  function nombreDiaSemana(fechaInicio, diaIndex) {
    if (!fechaInicio) return null;
    var f = new Date(fechaInicio.getTime());
    f.setDate(f.getDate() + diaIndex);
    var dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    return dias[f.getDay()];
  }

  function normalizar(s) {
    return s.toLowerCase()
      .replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i")
      .replace(/ó/g, "o").replace(/ú/g, "u");
  }

  function excursionDisponibleEnDia(ex, nombreDia) {
    if (!nombreDia) return true;
    var s = normalizar(ex.salidas);
    if (s.indexOf("todos los dias") !== -1) return true;
    if (s.indexOf("a consultar") !== -1) return true;
    if (s.indexOf("segun disponibilidad") !== -1) return true;
    if (s.indexOf("lunes a sabado") !== -1) return nombreDia !== "domingo";
    var DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
    var encontrados = DIAS.filter(function (d) { return s.indexOf(d) !== -1; });
    if (encontrados.length > 0) return encontrados.indexOf(nombreDia) !== -1;
    return true;
  }

  function precioEnDia(ex, nombreDia) {
    var precios = ex.precios;
    if (precios.promo && nombreDia) {
      var diasPromo = precios.promo.dias.map(normalizar);
      if (diasPromo.indexOf(nombreDia) !== -1) return precios.promo.precio;
    }
    return precios.efectivo_transferencia;
  }

  // ===================== ARMADOR =====================

  function setupArmadorForm() {
    var form = document.getElementById("armador-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!data) return;

      var presupuesto = parseFloat(document.getElementById("presupuesto").value);
      var personas = parseInt(document.getElementById("personas").value, 10);
      var fechaInicioStr = document.getElementById("fecha-inicio").value;
      var fechaSalidaStr = document.getElementById("fecha-salida").value;

      if (!presupuesto || !personas || !fechaInicioStr || !fechaSalidaStr) return;

      var fechaInicio = new Date(fechaInicioStr + "T00:00:00");
      var fechaSalida = new Date(fechaSalidaStr + "T00:00:00");
      var dias = Math.round((fechaSalida - fechaInicio) / (1000 * 60 * 60 * 24));

      if (dias <= 0) {
        alert("La fecha de salida debe ser posterior a la fecha de llegada.");
        return;
      }

      var presupuestoPorPersona = presupuesto / personas;
      var resultado = armarPropuesta(data.excursiones, dias, presupuestoPorPersona, fechaInicio);

      propuestaActual = {
        asignacion: resultado.asignacion,
        dias: dias,
        presupuesto: presupuesto,
        presupuestoPorPersona: presupuestoPorPersona,
        personas: personas,
        fechaInicio: fechaInicio
      };

      renderResultadoArmador();
      document.getElementById("armador-form").style.display = "none";
      document.getElementById("nueva-consulta-btn").hidden = false;
    });

    document.getElementById("nueva-consulta-btn").addEventListener("click", function () {
      propuestaActual = null;
      document.getElementById("armador-resultado").innerHTML = "";
      document.getElementById("armador-form").style.display = "";
      document.getElementById("nueva-consulta-btn").hidden = true;
      document.getElementById("presupuesto").value = "";
      document.getElementById("personas").value = "";
      document.getElementById("fecha-inicio").value = "";
      document.getElementById("fecha-salida").value = "";
    });

    document.getElementById("armador-resultado").addEventListener("click", function (e) {
      var toggleBtn = e.target.closest(".reemplazo-toggle");
      var optionBtn = e.target.closest(".reemplazo-opcion");

      if (toggleBtn) {
        var diaIdx = parseInt(toggleBtn.dataset.dia, 10);
        var panel = document.getElementById("reemplazo-panel-" + diaIdx);
        var abierto = panel.hidden === false;
        document.querySelectorAll(".reemplazo-panel").forEach(function (p) { p.hidden = true; });
        document.querySelectorAll(".reemplazo-toggle").forEach(function (b) { b.classList.remove("activo"); });
        if (!abierto) {
          panel.hidden = false;
          toggleBtn.classList.add("activo");
        }
        return;
      }

      if (optionBtn) {
        var diaIdx2 = parseInt(optionBtn.dataset.dia, 10);
        var exId = optionBtn.dataset.exid;
        var precio = parseFloat(optionBtn.dataset.precio);
        var ex = excursionesById[exId];
        if (!ex) return;
        propuestaActual.asignacion[diaIdx2] = { ex: ex, precio: precio };
        renderResultadoArmador();
        return;
      }
    });
  }

  function armarPropuesta(excursiones, dias, presupuestoPorPersona, fechaInicio) {
    function candidatasPorDiaParaNivel(nivel) {
      var pool = [];
      for (var d = 0; d < dias; d++) {
        var nombreDia = nombreDiaSemana(fechaInicio, d);
        var cands = excursiones
          .filter(function (ex) { return ex.prioridad === nivel && excursionDisponibleEnDia(ex, nombreDia); })
          .map(function (ex) { return { ex: ex, precio: precioEnDia(ex, nombreDia) }; })
          .filter(function (c) { return c.precio <= presupuestoPorPersona; })
          .sort(function (a, b) { return b.precio - a.precio; });
        pool.push({ nombreDia: nombreDia, candidatas: cands });
      }
      return pool;
    }

    function resolver(candidatasPorDia, asignacionFija, presupuestoRestante, excluidos) {
      var maxRestante = new Array(dias + 1).fill(0);
      for (var i = dias - 1; i >= 0; i--) {
        if (asignacionFija[i] !== null) { maxRestante[i] = maxRestante[i + 1]; continue; }
        var disponibles = candidatasPorDia[i].candidatas.filter(function (c) { return !excluidos[c.ex.id]; });
        var maxDia = disponibles.length ? disponibles[0].precio : 0;
        maxRestante[i] = maxRestante[i + 1] + maxDia;
      }

      var mejor = { total: -1, asignacion: asignacionFija.slice() };
      var usados = Object.assign({}, excluidos);
      var actual = asignacionFija.slice();
      var llamadas = 0;
      var LIMITE = 400000;

      function backtrack(d, totalActual) {
        llamadas++;
        if (llamadas > LIMITE) return;
        if (totalActual > mejor.total) {
          mejor.total = totalActual;
          mejor.asignacion = actual.slice();
        }
        if (d === dias) return;
        if (totalActual + maxRestante[d] <= mejor.total) return;
        if (actual[d] !== null) { backtrack(d + 1, totalActual); return; }
        var disponibles = candidatasPorDia[d].candidatas.filter(function (c) { return !usados[c.ex.id]; });
        for (var i = 0; i < disponibles.length; i++) {
          var cand = disponibles[i];
          if (totalActual + cand.precio > presupuestoRestante) continue;
          usados[cand.ex.id] = true;
          actual[d] = cand;
          backtrack(d + 1, totalActual + cand.precio);
          actual[d] = null;
          usados[cand.ex.id] = false;
        }
        backtrack(d + 1, totalActual);
      }

      backtrack(0, 0);
      return mejor;
    }

    var asignacion = new Array(dias).fill(null);
    var excluidos = {};
    var gastado = 0;

    for (var nivel = 1; nivel <= 3; nivel++) {
      var candsPorDia = candidatasPorDiaParaNivel(nivel);
      var resultado = resolver(candsPorDia, asignacion, presupuestoPorPersona - gastado, excluidos);
      for (var d2 = 0; d2 < dias; d2++) {
        if (asignacion[d2] === null && resultado.asignacion[d2] !== null) {
          var asig = resultado.asignacion[d2];
          asignacion[d2] = asig;
          gastado += asig.precio;
          excluidos[asig.ex.id] = true;
        }
      }
      var diasLibres = asignacion.filter(function (a) { return a === null; }).length;
      if (diasLibres === 0 || gastado >= presupuestoPorPersona) break;
    }

    return { asignacion: asignacion, totalPorPersona: gastado };
  }

  function renderResultadoArmador() {
    if (!propuestaActual) return;
    var asignacion = propuestaActual.asignacion;
    var dias = propuestaActual.dias;
    var presupuesto = propuestaActual.presupuesto;
    var presupuestoPorPersona = propuestaActual.presupuestoPorPersona;
    var personas = propuestaActual.personas;
    var fechaInicio = propuestaActual.fechaInicio;

    var totalPorPersona = asignacion.reduce(function (sum, a) { return sum + (a ? a.precio : 0); }, 0);
    var totalGrupo = totalPorPersona * personas;
    var sobrante = presupuesto - totalGrupo;
    var excursionesAsignadas = asignacion.filter(function (a) { return a !== null; }).length;

    function idsUsados(excluirDia) {
      var usados = {};
      asignacion.forEach(function (a, i) {
        if (a && i !== excluirDia) usados[a.ex.id] = true;
      });
      return usados;
    }

    var html = '<div class="propuesta-resumen">' +
      '<div class="stat"><span class="num">' + excursionesAsignadas + ' / ' + dias + '</span><span class="lbl">Excursiones</span></div>' +
      '<div class="stat"><span class="num">' + formatoMoneda(totalPorPersona) + '</span><span class="lbl">Por persona</span></div>' +
      '<div class="stat"><span class="num">' + formatoMoneda(totalGrupo) + '</span><span class="lbl">Total del grupo</span></div>' +
      '<div class="stat"><span class="num">' + formatoMoneda(sobrante) + '</span><span class="lbl">Presupuesto sin usar</span></div>' +
      '</div>';

    if (excursionesAsignadas === 0) {
      html += '<div class="armador-mensaje">No se encontró ninguna excursión que entre dentro del presupuesto por persona (' + formatoMoneda(presupuestoPorPersona) + '). Probá aumentar el presupuesto.</div>';
    }

    for (var d = 0; d < dias; d++) {
      var asignada = asignacion[d];
      var nombreDia = nombreDiaSemana(fechaInicio, d);
      var etiquetaDia = 'Día ' + (d + 1) + (nombreDia ? ' (' + capitalizar(nombreDia) + ')' : '');

      if (asignada) {
        var budgetSlot = presupuestoPorPersona - (totalPorPersona - asignada.precio);
        var usados = idsUsados(d);
        var opciones = data.excursiones
          .filter(function (ex) {
            return ex.id !== asignada.ex.id && !usados[ex.id] && excursionDisponibleEnDia(ex, nombreDia);
          })
          .map(function (ex) { return { ex: ex, precio: precioEnDia(ex, nombreDia) }; })
          .filter(function (c) { return c.precio <= budgetSlot; })
          .sort(function (a, b) { return a.ex.prioridad - b.ex.prioridad || b.precio - a.precio; });

        var opcionesHtml = opciones.length === 0
          ? '<p class="reemplazo-vacio">No hay otras excursiones disponibles para este día dentro del presupuesto.</p>'
          : opciones.map(function (op) {
              return '<button class="reemplazo-opcion" data-dia="' + d + '" data-exid="' + op.ex.id + '" data-precio="' + op.precio + '">' +
                '<span class="reemplazo-opcion__nombre">' + escapeHtml(op.ex.nombre) + '</span>' +
                '<span class="reemplazo-opcion__detalle">' + escapeHtml(op.ex.horario) + '</span>' +
                '<span class="reemplazo-opcion__precio">' + formatoMoneda(op.precio) + '</span>' +
                '</button>';
            }).join("");

        html += '<div class="propuesta-dia-wrap">' +
          '<div class="propuesta-dia">' +
            '<div class="propuesta-dia__dia">' + etiquetaDia + '</div>' +
            '<div class="propuesta-dia__excursion"><span class="nombre">' + escapeHtml(asignada.ex.nombre) + '</span><br><span class="detalle">' + escapeHtml(asignada.ex.horario) + '</span></div>' +
            '<div class="propuesta-dia__precio">' + formatoMoneda(asignada.precio) + ' / persona</div>' +
            '<button class="reemplazo-toggle" data-dia="' + d + '">&#8645; Cambiar</button>' +
          '</div>' +
          '<div class="reemplazo-panel" id="reemplazo-panel-' + d + '" hidden>' +
            '<p class="reemplazo-panel__titulo">Reemplazar por:</p>' + opcionesHtml +
          '</div>' +
        '</div>';
      } else {
        var usadosLibre = idsUsados(d);
        var opcionesLibre = data.excursiones
          .filter(function (ex) { return !usadosLibre[ex.id] && excursionDisponibleEnDia(ex, nombreDia); })
          .map(function (ex) { return { ex: ex, precio: precioEnDia(ex, nombreDia) }; })
          .filter(function (c) { return c.precio <= (presupuestoPorPersona - totalPorPersona); })
          .sort(function (a, b) { return a.ex.prioridad - b.ex.prioridad || b.precio - a.precio; });

        var opcionesLibreHtml = opcionesLibre.length === 0
          ? '<p class="reemplazo-vacio">No hay excursiones disponibles para agregar en este día dentro del presupuesto restante.</p>'
          : opcionesLibre.map(function (op) {
              return '<button class="reemplazo-opcion" data-dia="' + d + '" data-exid="' + op.ex.id + '" data-precio="' + op.precio + '">' +
                '<span class="reemplazo-opcion__nombre">' + escapeHtml(op.ex.nombre) + '</span>' +
                '<span class="reemplazo-opcion__detalle">' + escapeHtml(op.ex.horario) + '</span>' +
                '<span class="reemplazo-opcion__precio">' + formatoMoneda(op.precio) + '</span>' +
                '</button>';
            }).join("");

        html += '<div class="propuesta-dia-wrap">' +
          '<div class="propuesta-dia libre">' +
            '<div class="propuesta-dia__dia">' + etiquetaDia + '</div>' +
            '<div class="propuesta-dia__excursion">Día libre</div>' +
            '<div class="propuesta-dia__precio">—</div>' +
            '<button class="reemplazo-toggle" data-dia="' + d + '">+ Agregar</button>' +
          '</div>' +
          '<div class="reemplazo-panel" id="reemplazo-panel-' + d + '" hidden>' +
            '<p class="reemplazo-panel__titulo">Agregar excursión:</p>' + opcionesLibreHtml +
          '</div>' +
        '</div>';
      }
    }

    document.getElementById("armador-resultado").innerHTML = html;
  }

})();
