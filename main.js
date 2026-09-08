(function () {
  var statusEl = document.getElementById("status");
  function setStatus(msg, isError) {
    if (!statusEl) return;
    try {
      statusEl.textContent = msg;
      if (statusEl.parentElement) statusEl.parentElement.classList.toggle("error", !!isError);
    } catch (e) {}
  }

  function start() {
  var photoshop;
  try {
    photoshop = require("photoshop");
  } catch (err) {
    setStatus("Photoshop API indisponível: " + err.message, true);
    return;
  }

  var core = photoshop.core;
  var action = photoshop.action;
  var app = photoshop.app;
  var constants = null;
  try { constants = photoshop.constants; } catch (e) {}
  var uxp = require("uxp");

  var state = { profile: "casamento", intensity: 50 };

  var ATOMS = [
    { key: "skinHeal", label: "Pele" },
    { key: "freqSep", label: "Frequência" },
    { key: "dodgeBurn", label: "D&B" },
    { key: "eyes", label: "Olhos" },
    { key: "teeth", label: "Dentes" },
    { key: "grade", label: "Cor" },
    { key: "pelePerfeita", label: "Pele perfeita" },
    { key: "mesclagem", label: "Mesclagem" },
    { key: "copiarCores", label: "Copiar cores" },
    { key: "limparFundo", label: "Limpar fundo de estúdio" },
    { key: "limparFundoExterna", label: "Limpar fundo externa" },
    { key: "colorirFundo", label: "Colorir fundo de estúdio" },
    { key: "texturaPele", label: "Textura de pele" },
    { key: "remManchas", label: "Rem. manchas" },
    { key: "peleDoBruxo", label: "Pele XT" },
    { key: "glamourGlow", label: "Glamour glow" },
    { key: "tomPele", label: "Tom de pele" },
    { key: "remCabeloRosto", label: "Remover cabelo do rosto" },
    { key: "checkLayer", label: "Check layer" },
    { key: "solarCurve", label: "Solar curve" },
    { key: "dbCurvas", label: "DB curvas" },
    { key: "dodge", label: "Dodge" },
    { key: "burn", label: "Burn" },
    { key: "olhosTrocarCor", label: "Trocar cor" },
    { key: "olhosMagicos", label: "Olhos mágicos" },
    { key: "dbOlhos", label: "DB olhos" },
    { key: "olhosNitidez", label: "Nitidez" },
    { key: "olhosContorno", label: "Contorno" },
    { key: "dentesBrancos", label: "Dentes brancos" },
    { key: "batom", label: "Batom" },
    { key: "batomTrocarCor", label: "Trocar cor" },
    { key: "volumeBatom", label: "Volume do batom" },
    { key: "extratorDetalhes", label: "Extrator de detalhes" },
    { key: "grao", label: "Grão" },
    { key: "nitidez12", label: "Nitidez 1.2" },
    { key: "superNitidez", label: "Super nitidez" },
    { key: "desfoque", label: "Desfoque" },
    { key: "destaque", label: "Destaque" },
    { key: "contrasteFundo", label: "Contraste de fundo" },
    { key: "corIndireta", label: "Cor indireta" },
    { key: "escurecer", label: "Escurecer" },
    { key: "luzBaixa", label: "Luz baixa" },
    { key: "contrasteFinal", label: "Contraste final" },
    { key: "salvarFoto", label: "Salvar foto", exportKind: "save" },
    { key: "salvarComo", label: "Salvar como", exportKind: "jpg" },
    { key: "salvarInternet", label: "Salvar para internet", exportKind: "web" }
  ];
  var ATOM = {};
  ATOMS.forEach(function (a) { ATOM[a.key] = a; });

  var PROFILES = {
    casamento: { label: "Casamento" },
    quinze: { label: "15 anos" },
    corporativo: { label: "Corporativo" },
    beauty: { label: "Beauty" },
    newborn: { label: "Newborn" },
    externa: { label: "Externa" }
  };

  var CLASS_KEYS = {
    casamento: ["pelePerfeita", "freqSep", "dodgeBurn", "olhosMagicos", "dentesBrancos", "contrasteFinal", "limparFundo", "tomPele"],
    quinze: ["pelePerfeita", "glamourGlow", "olhosMagicos", "dentesBrancos", "batom", "contrasteFinal", "nitidez12"],
    corporativo: ["remManchas", "freqSep", "eyes", "contrasteFinal", "limparFundo", "nitidez12"],
    beauty: ["peleDoBruxo", "freqSep", "dodgeBurn", "glamourGlow", "olhosMagicos", "dentesBrancos", "batom", "contrasteFinal"],
    newborn: ["skinHeal", "tomPele", "glamourGlow", "contrasteFinal"],
    externa: ["pelePerfeita", "olhosMagicos", "nitidez12", "limparFundoExterna", "desfoque", "contrasteFinal"]
  };

  function applyClass(id) {
    if (!PROFILES[id]) return;
    state.profile = id;
    var keys = CLASS_KEYS[id] || [];
    var set = {};
    keys.forEach(function (k) { set[k] = true; });
    document.querySelectorAll("[data-lote]").forEach(function (cb) {
      cb.checked = !!set[cb.getAttribute("data-lote")];
    });
    document.querySelectorAll("[data-profile]").forEach(function (c) {
      c.className = c.getAttribute("data-profile") === id ? "chip active" : "chip";
    });
    refreshLote();
    setStatus(PROFILES[id].label + " · " + keys.length + " funções");
  }

  function t(i) { return i / 100; }
  function lerp(i, a, b) { return a + (b - a) * t(i); }
  function rnd(n) { return Math.round(n); }

  async function bp(list) {
    var cmds = list.map(function (d) {
      d._options = { dialogOptions: "silent" };
      return d;
    });
    try {
      return await action.batchPlay(cmds, { modalBehavior: "execute" });
    } catch (e) {
      return null;
    }
  }

  async function runModal(name, fn) {
    if (!app.documents.length) throw new Error("Abra um documento.");
    var modalErr = null;
    await core.executeAsModal(async function (ctx) {
      var doc = app.activeDocument;
      var host = ctx.hostControl;
      var token = await host.suspendHistory({ documentID: doc.id, name: name });
      try {
        await promoteBackground(doc);
        try { await deselect(); } catch (e) {}
        await fn(doc);
      } catch (err) {
        modalErr = err;
      } finally {
        await host.resumeHistory(token);
      }
    }, { commandName: name });
    if (modalErr) throw modalErr;
  }


  async function addMask(kind) {
    var using = "revealAll";
    if (kind === "selection") using = "revealSelection";
    if (kind === "hide") using = "hideAll";
    try {
      await bp([{
        _obj: "make",
        new: { _class: "channel" },
        at: { _ref: "channel", _enum: "channel", _value: "mask" },
        using: { _enum: "userMaskEnabled", _value: using }
      }]);
    } catch (e) {
      if (kind === "selection") {
        try {
          await bp([{
            _obj: "make",
            new: { _class: "channel" },
            at: { _ref: "channel", _enum: "channel", _value: "mask" },
            using: { _enum: "userMaskEnabled", _value: "revealAll" }
          }]);
        } catch (e2) {}
      }
    }
  }

  async function hasSelection() {
    try {
      var r = await bp([{
        _obj: "get",
        _target: [
          { _property: "selection" },
          { _ref: "document", _enum: "ordinal", _value: "targetEnum" }
        ]
      }]);
      return !!(r && r[0] && (r[0].selection || r[0].left != null));
    } catch (e) {
      return false;
    }
  }

  async function selectPeopleAI(tags) {
    var attempts = [];
    if (tags && tags.length) {
      attempts.push({
        _obj: "selectPeopleV2",
        selectAllPeople: true,
        tagsV2: tags,
        _options: { dialogOptions: "dontDisplay" }
      });
      attempts.push({
        _obj: "selectPeopleV2",
        selectAllPeople: true,
        tagsV2: tags,
        tagsIndices: [],
        _options: { dialogOptions: "dontDisplay" }
      });
    } else {
      attempts.push({
        _obj: "selectPeopleV2",
        selectAllPeople: true,
        _options: { dialogOptions: "dontDisplay" }
      });
    }
    for (var n = 0; n < attempts.length; n++) {
      try {
        await bp([attempts[n]]);
        if (await hasSelection()) return true;
      } catch (e) {}
    }
    if (tags && tags.length > 1) {
      for (var t = 0; t < tags.length; t++) {
        try {
          await bp([{
            _obj: "selectPeopleV2",
            selectAllPeople: true,
            tagsV2: [tags[t]],
            _options: { dialogOptions: "dontDisplay" }
          }]);
          if (await hasSelection()) return true;
        } catch (e) {}
      }
    }
    return false;
  }

  async function selectSkyAI() {
    try {
      await bp([{ _obj: "selectSky", sampleAllLayers: true, _options: { dialogOptions: "dontDisplay" } }]);
      if (await hasSelection()) return true;
    } catch (e) {}
    try {
      await bp([{
        _obj: "select",
        _target: [{ _ref: "menuItemClass", _enum: "menuItemType", _value: "selectSky" }],
        _options: { dialogOptions: "dontDisplay" }
      }]);
      if (await hasSelection()) return true;
    } catch (e) {}
    return false;
  }

  async function saveSel(name) {
    if (!(await hasSelection())) return false;
    var r = await bp([{
      _obj: "duplicate",
      _target: [{ _ref: "channel", _property: "selection" }],
      name: name
    }]);
    return !!r;
  }

  async function loadSel(name, modifier) {
    var cmd = {
      _obj: "set",
      _target: [{ _ref: "channel", _property: "selection" }],
      to: { _ref: "channel", _name: name }
    };
    if (modifier) cmd.selectionModifier = { _enum: "selectionModifierType", _value: modifier };
    var r = await bp([cmd]);
    return !!r;
  }

  async function deleteChannel(name) {
    try {
      await bp([{ _obj: "delete", _target: [{ _ref: "channel", _name: name }] }]);
    } catch (e) {}
  }

  async function subtractPeople(tags) {
    if (!(await hasSelection())) return;
    if (!(await saveSel("XT · keep"))) return;
    var ok = false;
    try { ok = await selectPeopleAI(tags); } catch (e) {}
    if (ok) {
      if (!(await saveSel("XT · cut"))) ok = false;
      await loadSel("XT · keep");
      if (ok) await loadSel("XT · cut", "subtractFromSelection");
      await deleteChannel("XT · cut");
    } else {
      await loadSel("XT · keep");
    }
    await deleteChannel("XT · keep");
  }

  async function intersectSubject() {
    if (!(await hasSelection())) return;
    if (!(await saveSel("XT · keep"))) return;
    var ok = false;
    try {
      await selectSubject();
      ok = await hasSelection();
    } catch (e) {}
    if (!ok) {
      try { ok = await selectPeopleAI(null); } catch (e) {}
    }
    if (ok) {
      if (!(await saveSel("XT · subj"))) ok = false;
      await loadSel("XT · keep");
      if (ok) await loadSel("XT · subj", "suppressSelection");
      await deleteChannel("XT · subj");
    } else {
      await loadSel("XT · keep");
    }
    await deleteChannel("XT · keep");
  }

  async function refineSel(kind) {
    var contract = 0;
    var expand = 0;
    var feather = 2.5;
    var smooth = 3;
    var shift = 0;
    var radius = 0.8;
    if (kind === "skin") { contract = 2; feather = 2.2; smooth = 4; shift = -10; radius = 0.6; }
    else if (kind === "hair") { expand = 2; feather = 5; smooth = 1; radius = 2.5; shift = 8; }
    else if (kind === "eyes") { expand = 4; feather = 2.2; smooth = 2; radius = 0.5; }
    else if (kind === "iris") { expand = 1; feather = 1.2; smooth = 1; radius = 0.3; }
    else if (kind === "sclera") { expand = 2; feather = 1.8; smooth = 2; radius = 0.4; }
    else if (kind === "lips" || kind === "teeth") { contract = 0; expand = 1; feather = 1.1; smooth = 2; radius = 0.4; }
    else if (kind === "subject") { feather = 2; smooth = 3; }
    else if (kind === "background") { expand = 4; feather = 3.5; smooth = 2; }
    if (contract) {
      try { await bp([{ _obj: "contract", by: { _unit: "pixelsUnit", _value: contract } }]); } catch (e) {}
    }
    if (expand) {
      try { await bp([{ _obj: "expand", by: { _unit: "pixelsUnit", _value: expand } }]); } catch (e) {}
    }
    try {
      await bp([{
        _obj: "refineSelectionEdge",
        borderRadius: { _unit: "pixelsUnit", _value: radius },
        smooth: smooth,
        feather: { _unit: "pixelsUnit", _value: feather },
        contrast: kind === "hair" ? 8 : 22,
        shiftEdge: shift,
        purify: false
      }]);
    } catch (e) {
      try { await bp([{ _obj: "feather", radius: { _unit: "pixelsUnit", _value: feather } }]); } catch (e2) {}
    }
  }

  async function blendIfMids() {
    try {
      await bp([{
        _obj: "set",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: {
          _obj: "layer",
          blendRange: [{
            _obj: "blendRange",
            channel: { _ref: "channel", _enum: "channel", _value: "gray" },
            srcBlackMin: 0,
            srcBlackMax: 18,
            srcWhiteMin: 238,
            srcWhiteMax: 255
          }]
        }
      }]);
    } catch (e) {}
  }

  var PEOPLE_TAGS = {
    skin: ["Facial skin", "Upper body skin", "Face Skin", "Skin", "Pele facial"],
    eyes: ["Eyes", "Eye", "Olhos"],
    iris: ["Iris", "Pupils", "Íris", "Pupila"],
    sclera: ["Sclera", "Eye white", "Whites of the eyes", "White of the eye", "Esclerótica"],
    teeth: ["Teeth", "Dentes"],
    lips: ["Lips", "Mouth", "Lip", "Lábios", "Boca"],
    hair: ["Hair", "Cabelo"],
    brows: ["Eyebrows", "Eyebrow", "Sobrancelhas"]
  };

  function unitVal(v) {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    if (typeof v === "object" && v.value != null) return Number(v.value) || 0;
    return Number(v) || 0;
  }

  async function selectionIsFeature(maxRatio) {
    if (!(await hasSelection())) return false;
    try {
      var b = app.activeDocument.selection.bounds;
      var l = unitVal(b.left != null ? b.left : b[0]);
      var t = unitVal(b.top != null ? b.top : b[1]);
      var r = unitVal(b.right != null ? b.right : b[2]);
      var bot = unitVal(b.bottom != null ? b.bottom : b[3]);
      var area = Math.max(0, r - l) * Math.max(0, bot - t);
      var dw = unitVal(app.activeDocument.width);
      var dh = unitVal(app.activeDocument.height);
      var da = Math.max(1, dw * dh);
      return area > 40 && area < da * maxRatio;
    } catch (e) {
      try {
        var g = await bp([{
          _obj: "get",
          _target: [
            { _property: "selection" },
            { _ref: "document", _enum: "ordinal", _value: "targetEnum" }
          ]
        }]);
        var s = g && g[0];
        if (!s) return false;
        var l2 = unitVal(s.left), t2 = unitVal(s.top), r2 = unitVal(s.right), b2 = unitVal(s.bottom);
        if (r2 <= l2 || b2 <= t2) return false;
        var da2 = Math.max(1, unitVal(app.activeDocument.width) * unitVal(app.activeDocument.height));
        var area2 = (r2 - l2) * (b2 - t2);
        return area2 > 40 && area2 < da2 * maxRatio;
      } catch (e2) {
        return false;
      }
    }
  }

  async function selectFeature(kind) {
    var tags = PEOPLE_TAGS[kind] || [];
    var maxRatio = { eyes: 0.16, iris: 0.1, sclera: 0.12, lips: 0.14, teeth: 0.1, brows: 0.14, hair: 0.65 }[kind] || 0.18;
    async function tryCmd(cmd) {
      try { await deselect(); } catch (e) {}
      await bp([cmd]);
      return await selectionIsFeature(maxRatio);
    }
    if (tags.length && await tryCmd({ _obj: "selectPeopleV2", selectAllPeople: true, tagsV2: tags })) return true;
    for (var t = 0; t < tags.length; t++) {
      if (await tryCmd({ _obj: "selectPeopleV2", selectAllPeople: true, tagsV2: [tags[t]] })) return true;
    }
    var primary = tags[0];
    var idxs = kind === "eyes" ? [3, 4, 2, 5]
      : kind === "iris" ? [4, 3, 5, 2]
      : kind === "sclera" ? [5, 4, 3, 6]
      : [6, 7, 8, 5, 4];
    for (var n = 0; n < idxs.length; n++) {
      if (await tryCmd({
        _obj: "selectPeopleV2",
        selectAllPeople: true,
        tagsV2: [primary],
        tagsIndices: [idxs[n]]
      })) return true;
    }
    try { await deselect(); } catch (e) {}
    return false;
  }

  async function selectAI(kind) {
    try { await deselect(); } catch (e) {}
    if (kind === "sky") return await selectSkyAI();
    if (kind === "background") {
      if (await selectAI("subject")) {
        await invertSel();
        return true;
      }
      return false;
    }
    if (kind === "subject") {
      if (await selectPeopleAI(null)) return true;
      await selectSubject();
      return await hasSelection();
    }
    if (kind === "eyes" || kind === "iris" || kind === "sclera" || kind === "lips" || kind === "teeth" || kind === "brows") {
      return await selectFeature(kind);
    }
    var tags = PEOPLE_TAGS[kind];
    var ok = !!(tags && await selectPeopleAI(tags));
    if (!ok && kind === "skin") {
      try {
        await bp([{
          _obj: "colorRange",
          colors: { _enum: "colors", _value: "skinTones" },
          fuzziness: 72
        }]);
        ok = await hasSelection();
      } catch (e) {}
    }
    if (!ok) {
      await selectSubject();
      ok = await hasSelection();
      if (!ok) return false;
    }
    if (kind === "skin") {
      await subtractPeople(PEOPLE_TAGS.eyes);
      await subtractPeople(PEOPLE_TAGS.lips);
      await subtractPeople(PEOPLE_TAGS.brows);
      await subtractPeople(["Teeth"]);
      await intersectSubject();
    }
    return await hasSelection();
  }

  async function finishMask(kind) {
    var feature = kind === "eyes" || kind === "iris" || kind === "sclera" || kind === "lips" || kind === "teeth" || kind === "brows";
    try {
      if (!kind || kind === "reveal") {
        await addMask("reveal");
        try { await deselect(); } catch (e) {}
        return;
      }
      var ok = await selectAI(kind);
      if (ok) {
        await refineSel(kind);
        await addMask("selection");
        if (kind === "skin") await blendIfMids();
      } else {
        await addMask(feature ? "hide" : "reveal");
      }
    } catch (e) {
      await addMask(feature ? "hide" : "reveal");
    }
    try { await deselect(); } catch (e) {}
  }

  async function promoteBackground(doc) {
    try {
      var layers = doc.layers;
      for (var i = 0; i < layers.length; i++) {
        try {
          if (layers[i].isBackgroundLayer) {
            layers[i].isBackgroundLayer = false;
            if (!layers[i].name) layers[i].name = "Fundo";
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  async function stamp(doc, name) {
    try { await deselect(); } catch (e) {}
    await promoteBackground(doc);

    var beforeId = null;
    try { beforeId = doc.activeLayers[0] && doc.activeLayers[0].id; } catch (e) {}
    var nLayers = 1;
    try { nLayers = doc.layers.length; } catch (e) {}

    if (nLayers > 1) {
      await bp([{ _obj: "mergeVisible", duplicate: true }]);
      try {
        var stamped = doc.activeLayers[0];
        if (stamped && stamped.id !== beforeId) {
          try { stamped.name = name; } catch (e) {}
          return stamped;
        }
      } catch (e) {}
    }

    try {
      var src = (doc.activeLayers && doc.activeLayers[0]) || (doc.layers && doc.layers[0]);
      if (src && typeof src.duplicate === "function") {
        var dup = await src.duplicate();
        try { dup.name = name; } catch (e) {}
        if (dup) return dup;
      }
    } catch (e) {}

    await bp([{
      _obj: "duplicate",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }]
    }]);
    var layer = doc.activeLayers[0];
    if (!layer) throw new Error("Não copiou a imagem. Clique na camada da foto e tente de novo.");
    try { layer.name = name; } catch (e) {}
    return layer;
  }

  function is16(doc) {
    var b = doc.bitsPerChannel;
    if (b === 16) return true;
    try {
      if (constants && constants.BitsPerChannelType && b === constants.BitsPerChannelType.SIXTEEN) return true;
    } catch (e) {}
    return String(b).toLowerCase().indexOf("sixteen") >= 0 || String(b) === "16";
  }

  async function gauss(layer, radius) {
    if (typeof layer.applyGaussianBlur === "function") await layer.applyGaussianBlur(radius);
    else await bp([{ _obj: "gaussianBlur", radius: { _unit: "pixelsUnit", _value: radius } }]);
  }

  async function surface(layer, radius, threshold) {
    if (typeof layer.applySurfaceBlur === "function") await layer.applySurfaceBlur(radius, threshold);
    else await bp([{ _obj: "surfaceBlur", radius: { _unit: "pixelsUnit", _value: radius }, threshold: threshold }]);
  }

  async function highPass(layer, radius) {
    if (typeof layer.applyHighPass === "function") await layer.applyHighPass(radius);
    else await bp([{ _obj: "highPass", radius: { _unit: "pixelsUnit", _value: radius } }]);
  }

  async function unsharp(layer, amount, radius) {
    if (typeof layer.applyUnsharpMask === "function") await layer.applyUnsharpMask(amount, radius, 3);
    else await bp([{
      _obj: "unsharpMask",
      amount: { _unit: "percentUnit", _value: amount },
      radius: { _unit: "pixelsUnit", _value: radius },
      threshold: 3
    }]);
  }

  async function setBlend(layer, mode) {
    try { layer.blendMode = mode; } catch (e) {
      await bp([{
        _obj: "set",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: { _obj: "layer", mode: { _enum: "blendMode", _value: mode } }
      }]);
    }
  }

  async function fillGray() {
    await bp([{
      _obj: "fill",
      using: { _enum: "fillContents", _value: "color" },
      color: { _obj: "RGBColor", red: 128, grain: 128, blue: 128 },
      opacity: { _unit: "percentUnit", _value: 100 },
      mode: { _enum: "blendMode", _value: "normal" }
    }]);
  }

  async function selectSubject() {
    try {
      await bp([{ _obj: "autoCutout", sampleAllLayers: true }]);
    } catch (e) {
      await bp([{ _obj: "selectSubject", sampleAllLayers: true }]);
    }
  }

  async function invertSel() { await bp([{ _obj: "inverse" }]); }
  async function deselect() {
    await bp([{
      _obj: "set",
      _target: [{ _ref: "channel", _property: "selection" }],
      to: { _enum: "ordinal", _value: "none" }
    }]);
  }

  async function acr(i, extra) {
    extra = extra || {};
    function pack(ver, pv) {
      var cr = extra.cr != null ? extra.cr : rnd(lerp(i, 8, 20));
      var te = extra.te != null ? extra.te : rnd(lerp(i, 4, 14));
      var st = extra.st != null ? extra.st : rnd(lerp(i, 2, 8));
      var ti = extra.ti != null ? extra.ti : rnd(lerp(i, 2, 8));
      return {
        _obj: "Adobe Camera Raw Filter",
        "$CrVe": ver,
        "$PrVN": pv,
        "$PrVe": 184549376,
        "$Ex12": extra.ex != null ? extra.ex : lerp(i, 0.04, 0.2),
        "$Cn12": cr,
        "$Cr12": cr,
        "$Hi12": extra.hi != null ? extra.hi : rnd(lerp(i, -18, -34)),
        "$Sh12": extra.sh != null ? extra.sh : rnd(lerp(i, 12, 28)),
        "$Wh12": extra.wh != null ? extra.wh : rnd(lerp(i, 4, 14)),
        "$Bk12": extra.bk != null ? extra.bk : rnd(lerp(i, -8, -16)),
        "$Te12": te,
        "$Temp": te,
        "$Tt12": ti,
        "$Tint": ti,
        "$Tx12": extra.tx != null ? extra.tx : rnd(lerp(i, 4, 14)),
        "$Cl12": extra.cl != null ? extra.cl : rnd(lerp(i, -10, -24)),
        "$Dh12": extra.dh != null ? extra.dh : rnd(lerp(i, 1, 6)),
        "$Vibr": extra.vi != null ? extra.vi : rnd(lerp(i, 10, 22)),
        "$Strt": st,
        "$Sa12": st,
        "$Shrp": extra.shp != null ? extra.shp : rnd(lerp(i, 18, 36)),
        "$ShpR": 1,
        "$ShpD": 25,
        "$LNR": rnd(lerp(i, 8, 22)),
        "$CNR": rnd(lerp(i, 6, 16))
      };
    }
    var r = await bp([pack("17.0", 6)]);
    if (r) return r;
    r = await bp([pack("16.0", 6)]);
    if (r) return r;
    return await bp([pack("15.4", 5)]);
  }

  async function toSmartObject() {
    var r = await bp([{ _obj: "newPlacedLayer" }]);
    return !!r;
  }

  async function makeLevels(i) {
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "levels",
          presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
          adjustment: [{
            _obj: "levelsAdjustment",
            channel: { _ref: "channel", _enum: "channel", _value: "composite" },
            input: [rnd(lerp(i, 6, 14)), lerp(i, 1.02, 1.06), rnd(lerp(i, 248, 242))]
          }]
        },
        name: "XT · Níveis"
      }
    }]);
  }

  async function makeExposure(i) {
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "exposure",
          exposure: lerp(i, 0.04, 0.16),
          offset: 0,
          gammaCorrection: lerp(i, 1.0, 1.04)
        },
        name: "XT · Exposição"
      }
    }]);
  }

  async function makeCurvesGrade(i) {
    var mid = rnd(lerp(i, 130, 138));
    var sh = rnd(lerp(i, 58, 52));
    var hi = rnd(lerp(i, 196, 206));
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "curves",
          presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
          adjustment: [
            {
              _obj: "curvesAdjustment",
              channel: { _ref: "channel", _enum: "channel", _value: "composite" },
              curve: [
                { _obj: "paint", horizontal: 0, vertical: 0 },
                { _obj: "paint", horizontal: 64, vertical: sh },
                { _obj: "paint", horizontal: 128, vertical: mid },
                { _obj: "paint", horizontal: 192, vertical: hi },
                { _obj: "paint", horizontal: 255, vertical: 255 }
              ]
            },
            {
              _obj: "curvesAdjustment",
              channel: { _ref: "channel", _enum: "channel", _value: "red" },
              curve: [
                { _obj: "paint", horizontal: 0, vertical: 0 },
                { _obj: "paint", horizontal: 128, vertical: rnd(lerp(i, 128, 134)) },
                { _obj: "paint", horizontal: 255, vertical: 255 }
              ]
            },
            {
              _obj: "curvesAdjustment",
              channel: { _ref: "channel", _enum: "channel", _value: "blue" },
              curve: [
                { _obj: "paint", horizontal: 0, vertical: rnd(lerp(i, 6, 12)) },
                { _obj: "paint", horizontal: 255, vertical: rnd(lerp(i, 248, 242)) }
              ]
            }
          ]
        },
        name: "XT · Curvas"
      }
    }]);
  }

  async function makeHueSat(i) {
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "hueSaturation",
          presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
          colorize: false,
          adjustment: [
            { _obj: "hueSatAdjustmentV2", hue: 0, saturation: rnd(lerp(i, 2, 8)), lightness: 0 },
            {
              _obj: "hueSatAdjustmentV2",
              localRange: 1,
              beginRamp: 315, beginSustain: 345, endSustain: 15, endRamp: 45,
              hue: rnd(lerp(i, -2, 3)),
              saturation: rnd(lerp(i, -2, 8)),
              lightness: rnd(lerp(i, 1, 4))
            },
            {
              _obj: "hueSatAdjustmentV2",
              localRange: 2,
              beginRamp: 15, beginSustain: 45, endSustain: 75, endRamp: 105,
              hue: 0,
              saturation: rnd(lerp(i, -12, -4)),
              lightness: 1
            }
          ]
        },
        name: "XT · Matiz/Saturação"
      }
    }]);
  }

  async function makeSelective(i) {
    var y = rnd(lerp(i, 4, 10));
    var k = rnd(lerp(i, 2, 6));
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "selectiveColor",
          presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
          method: { _enum: "correctionMethod", _value: "relative" },
          colorCorrection: [
            {
              _obj: "colorCorrection",
              colors: { _enum: "colors", _value: "reds" },
              magenta: { _unit: "percentUnit", _value: rnd(lerp(i, 2, 6)) },
              yellowColor: { _unit: "percentUnit", _value: y },
              black: { _unit: "percentUnit", _value: rnd(lerp(i, 1, 4)) }
            },
            {
              _obj: "colorCorrection",
              colors: { _enum: "colors", _value: "yellows" },
              magenta: { _unit: "percentUnit", _value: 2 },
              yellowColor: { _unit: "percentUnit", _value: rnd(lerp(i, -12, -4)) }
            },
            {
              _obj: "colorCorrection",
              colors: { _enum: "colors", _value: "neutrals" },
              black: { _unit: "percentUnit", _value: k }
            },
            {
              _obj: "colorCorrection",
              colors: { _enum: "colors", _value: "whites" },
              black: { _unit: "percentUnit", _value: rnd(lerp(i, -4, -1)) }
            },
            {
              _obj: "colorCorrection",
              colors: { _enum: "colors", _value: "blacks" },
              black: { _unit: "percentUnit", _value: rnd(lerp(i, 2, 6)) }
            }
          ]
        },
        name: "XT · Cor seletiva"
      }
    }]);
  }

  async function makeBalance(i) {
    var warm = rnd(lerp(i, 4, 12));
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "colorBalance",
          shadowLevels: [0, 0, rnd(lerp(i, 3, 8))],
          midtoneLevels: [rnd(lerp(i, 2, 6)), 0, -rnd(lerp(i, 1, 4))],
          highlightLevels: [warm, rnd(lerp(i, 1, 4)), -warm],
          preserveLuminosity: true
        },
        name: "XT · Balance"
      }
    }]);
  }

  async function acrAuto() {
    var tries = [
      { _obj: "Adobe Camera Raw Filter", "$CrVe": "17.0", "$PrVN": 6, "$PrVe": 184549376, "$Au12": true },
      { _obj: "Adobe Camera Raw Filter", "$CrVe": "16.0", "$PrVN": 6, "$PrVe": 184549376, "$Au12": true },
      { _obj: "Adobe Camera Raw Filter", "$CrVe": "15.4", "$PrVN": 5, "$PrVe": 184549376, "$Au12": true },
      { _obj: "Adobe Camera Raw Filter", "$CrVe": "15.4", "$PrVN": 5, "$PrVe": 184549376, "$Auto": true },
      { _obj: "Adobe Camera Raw Filter", "$CrVe": "15.4", "$PrVN": 5, "$PrVe": 184549376, autoNeutral: true }
    ];
    for (var n = 0; n < tries.length; n++) {
      if (await bp([tries[n]])) return true;
    }
    return false;
  }

  async function makeLevelsAuto() {
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: { _obj: "levels", presetKind: { _enum: "presetKindType", _value: "presetKindDefault" } },
        name: "XT · Níveis Auto"
      }
    }]);
    await bp([{
      _obj: "set",
      _target: [{ _ref: "adjustmentLayer", _enum: "ordinal", _value: "targetEnum" }],
      to: {
        _obj: "levels",
        auto: true,
        autoOptions: {
          _obj: "autoOptions",
          algorithm: { _enum: "autoAlgorithm", _value: "enhancedDecreaseA" },
          shadows: 0.001,
          highlights: 0.001
        }
      }
    }]);
  }

  async function colorGradePro(doc, i) {
    var raw = await stamp(doc, "XT · Camera Raw Auto");
    await toSmartObject();
    var usedAcr = await acrAuto();
    if (!usedAcr) {
      await bp([{ _obj: "autoColor" }]);
      await bp([{ _obj: "autoContrast" }]);
    }
    try { (raw || doc.activeLayers[0]).opacity = lerp(i, 36, 58); } catch (e) {
      try { doc.activeLayers[0].opacity = lerp(i, 36, 58); } catch (e2) {}
    }

    await makeLevelsAuto();
    try { doc.activeLayers[0].opacity = lerp(i, 28, 48); } catch (e) {}

    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: { _obj: "vibrance", vibrance: rnd(lerp(i, 5, 12)), saturation: rnd(lerp(i, 0, 3)) },
        name: "XT · Vibrance"
      }
    }]);
    try { doc.activeLayers[0].opacity = lerp(i, 45, 70); } catch (e) {}
  }

  async function adjVibrance(i, name, maskKind) {
    if (maskKind && maskKind !== "reveal") await selectAI(maskKind);
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: { _obj: "vibrance", vibrance: rnd(lerp(i, 8, 22)), saturation: rnd(lerp(i, 1, 6)) },
        name: name || "XT · Vibrance"
      }
    }]);
    try { await deselect(); } catch (e) {}
  }

  async function adjWarm(i, maskKind) {
    if (maskKind && maskKind !== "reveal") await selectAI(maskKind);
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "photoFilter",
          color: { _obj: "RGBColor", red: 236, grain: 138, blue: 0 },
          density: rnd(lerp(i, 6, 16)),
          preserveLuminosity: true
        },
        name: "XT · Tom quente"
      }
    }]);
    try { await deselect(); } catch (e) {}
  }

  async function adjCurvesUp(name, maskKind) {
    await selectAI(maskKind || "skin");
    try { await bp([{ _obj: "feather", radius: { _unit: "pixelsUnit", _value: 4 } }]); } catch (e) {}
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "curves",
          presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
          adjustment: [{
            _obj: "curvesAdjustment",
            channel: { _ref: "channel", _enum: "channel", _value: "composite" },
            curve: [
              { _obj: "paint", horizontal: 0, vertical: 0 },
              { _obj: "paint", horizontal: 128, vertical: 140 },
              { _obj: "paint", horizontal: 255, vertical: 255 }
            ]
          }]
        },
        name: name
      }
    }]);
    try { await deselect(); } catch (e) {}
  }

  async function adjCurvesDown(name, maskKind) {
    await selectAI(maskKind || "skin");
    try { await bp([{ _obj: "feather", radius: { _unit: "pixelsUnit", _value: 4 } }]); } catch (e) {}
    await bp([{
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "curves",
          presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
          adjustment: [{
            _obj: "curvesAdjustment",
            channel: { _ref: "channel", _enum: "channel", _value: "composite" },
            curve: [
              { _obj: "paint", horizontal: 0, vertical: 0 },
              { _obj: "paint", horizontal: 128, vertical: 116 },
              { _obj: "paint", horizontal: 255, vertical: 255 }
            ]
          }]
        },
        name: name
      }
    }]);
    try { await deselect(); } catch (e) {}
  }

  async function freqSep(doc, i) {
    var w = 3000, h = 4000;
    try {
      w = doc.width && doc.width.value != null ? doc.width.value : doc.width;
      h = doc.height && doc.height.value != null ? doc.height.value : doc.height;
    } catch (e) {}
    var minSide = Math.min(Number(w) || 3000, Number(h) || 4000);
    var radius = Math.max(5, Math.min(30, lerp(i, minSide / 420, minSide / 220)));

    var lf = await stamp(doc, "XT · LF");
    var hf = null;
    try {
      hf = await lf.duplicate();
    } catch (e) {
      await bp([{ _obj: "duplicate", _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }] }]);
      hf = doc.activeLayers[0];
    }
    try { hf.name = "XT · HF"; } catch (e) {}

    await bp([{ _obj: "select", _target: [{ _ref: "layer", _name: "XT · LF" }], makeVisible: false }]);
    await gauss(doc.activeLayers[0], radius);

    await bp([{ _obj: "select", _target: [{ _ref: "layer", _name: "XT · HF" }], makeVisible: false }]);
    var apply = is16(doc)
      ? {
          _obj: "applyImageEvent",
          with: {
            _obj: "calculation",
            to: { _ref: [{ _ref: "channel", _enum: "channel", _value: "RGB" }, { _ref: "layer", _name: "XT · LF" }] },
            calculation: { _enum: "calculationType", _value: "add" },
            scale: 2,
            offset: 0,
            invert: true
          }
        }
      : {
          _obj: "applyImageEvent",
          with: {
            _obj: "calculation",
            to: { _ref: [{ _ref: "channel", _enum: "channel", _value: "RGB" }, { _ref: "layer", _name: "XT · LF" }] },
            calculation: { _enum: "calculationType", _value: "subtract" },
            scale: 2,
            offset: 128,
            invert: false
          }
        };
    await bp([apply]);
    await setBlend(doc.activeLayers[0], "linearLight");
    try { doc.activeLayers[0].opacity = 100; } catch (e) {}

    try {
      if (hf && lf && typeof hf.moveAbove === "function") await hf.moveAbove(lf);
    } catch (e) {
      try {
        await bp([{
          _obj: "move",
          _target: [{ _ref: "layer", _name: "XT · HF" }],
          to: { _ref: "layer", _name: "XT · LF" },
          adjustment: false,
          version: 5
        }]);
      } catch (e2) {}
    }

    await bp([{ _obj: "select", _target: [{ _ref: "layer", _name: "XT · LF" }], makeVisible: false }]);
    await finishMask("skin");
    await bp([{ _obj: "select", _target: [{ _ref: "layer", _name: "XT · HF" }], makeVisible: false }]);
    await finishMask("skin");
  }

  async function dustScratches(layer, radius, threshold) {
    radius = Math.max(1, rnd(radius));
    threshold = Math.max(0, rnd(threshold));
    try {
      if (layer && typeof layer.applyDustAndScratches === "function") {
        await layer.applyDustAndScratches(radius, threshold);
        return;
      }
    } catch (e) {}
    try {
      await bp([{ _obj: "dustAndScratches", radius: radius, threshold: threshold }]);
    } catch (e) {
      try {
        await bp([{ _obj: "median", radius: { _unit: "pixelsUnit", _value: Math.max(1, radius - 1) } }]);
      } catch (e2) {
        await surface(layer, Math.max(3, radius * 2), threshold);
      }
    }
  }

  async function peleXT(doc, i) {
    var w = 3000, h = 4000;
    try {
      w = doc.width && doc.width.value != null ? doc.width.value : doc.width;
      h = doc.height && doc.height.value != null ? doc.height.value : doc.height;
    } catch (e) {}
    var minSide = Math.min(Number(w) || 3000, Number(h) || 4000);
    var surfR = Math.max(8, Math.min(42, lerp(i, minSide / 260, minSide / 130)));
    var surfT = rnd(lerp(i, 14, 26));
    var dsR = Math.max(2, Math.min(12, lerp(i, minSide / 700, minSide / 380)));
    var dsT = rnd(lerp(i, 10, 20));
    var hpR = lerp(i, 1.3, 2.6);

    var pele = await stamp(doc, "XT · Pele");
    await surface(pele, surfR, surfT);
    pele.opacity = lerp(i, 72, 92);
    await finishMask("skin");
    await blendIfMids();

    var manchas = await stamp(doc, "XT · Manchas");
    await dustScratches(manchas, dsR, dsT);
    try {
      await bp([{ _obj: "median", radius: { _unit: "pixelsUnit", _value: Math.max(1, rnd(dsR * 0.6)) } }]);
    } catch (e) {}
    manchas.opacity = lerp(i, 70, 90);
    await finishMask("skin");

    var tex = await stamp(doc, "XT · Textura");
    await highPass(tex, hpR);
    await setBlend(tex, "linearLight");
    tex.opacity = lerp(i, 24, 44);
    await finishMask("skin");
  }

  async function blendRange(s0, s1, s2, s3, d0, d1, d2, d3) {
    try {
      await bp([{
        _obj: "set",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: {
          _obj: "layer",
          blendRange: [{
            _obj: "blendRange",
            channel: { _ref: "channel", _enum: "channel", _value: "gray" },
            srcBlackMin: s0,
            srcBlackMax: s1,
            srcWhiteMin: s2,
            srcWhiteMax: s3,
            destBlackMin: d0,
            destBlackMax: d1,
            destWhiteMin: d2,
            destWhiteMax: d3
          }]
        }
      }]);
    } catch (e) {}
  }

  async function dodgeBurnPro(doc, i, scope) {
    scope = scope || "subject";
    var w = 3000, h = 4000;
    try {
      w = doc.width && doc.width.value != null ? doc.width.value : doc.width;
      h = doc.height && doc.height.value != null ? doc.height.value : doc.height;
    } catch (e) {}
    var minSide = Math.min(Number(w) || 3000, Number(h) || 4000);
    var hp = Math.max(14, Math.min(90, lerp(i, minSide / 130, minSide / 65)));

    var vol = await stamp(doc, "XT · D&B Volume");
    await highPass(vol, hp);
    await setBlend(vol, "softLight");
    vol.opacity = lerp(i, 34, 64);
    await finishMask(scope);
    await blendIfMids();

    var dodge = await stamp(doc, "XT · Dodge");
    await setBlend(dodge, "screen");
    dodge.opacity = lerp(i, 12, 24);
    await finishMask(scope);
    await blendRange(0, 0, 255, 255, 0, 78, 255, 255);

    var burn = await stamp(doc, "XT · Burn");
    await setBlend(burn, "multiply");
    burn.opacity = lerp(i, 10, 22);
    await finishMask(scope);
    await blendRange(0, 0, 255, 255, 0, 0, 178, 255);
  }

  async function dodgeEyes(doc, i) {
    var d = await stamp(doc, "XT · Dodge olhos");
    await unsharp(d, lerp(i, 28, 70), 1.15);
    await setBlend(d, "screen");
    d.opacity = lerp(i, 20, 42);
    await finishMask("eyes");
    await blendRange(0, 0, 255, 255, 0, 60, 255, 255);
  }

  async function burnEyes(doc, i) {
    var b = await stamp(doc, "XT · Contorno olhos");
    await setBlend(b, "multiply");
    b.opacity = lerp(i, 10, 22);
    await finishMask("eyes");
    await blendRange(0, 0, 255, 255, 0, 0, 190, 255);
  }

  async function selectSclera() {
    if (await selectFeature("sclera")) return true;
    if (!(await selectFeature("eyes"))) return false;
    if (!(await saveSel("XT · eyeAll"))) return false;
    if (await selectFeature("iris")) {
      await saveSel("XT · irisCut");
      await loadSel("XT · eyeAll");
      await loadSel("XT · irisCut", "subtractFromSelection");
      await deleteChannel("XT · irisCut");
      await deleteChannel("XT · eyeAll");
      return await selectionIsFeature(0.14);
    }
    await loadSel("XT · eyeAll");
    await deleteChannel("XT · eyeAll");
    return false;
  }

  async function groupNamedLayers(names, groupName) {
    if (!names || !names.length) return;
    for (var n = 0; n < names.length; n++) {
      var cmd = { _obj: "select", _target: [{ _ref: "layer", _name: names[n] }] };
      if (n > 0) cmd.selectionModifier = { _enum: "selectionModifierType", _value: "addToSelection" };
      await bp([cmd]);
    }
    await bp([{
      _obj: "make",
      _target: [{ _ref: "layerSection" }],
      using: { _obj: "layerSection", name: groupName }
    }]);
  }

  async function eyesPro(doc, i) {
    var names = [];

    var iris = await stamp(doc, "XT · Íris");
    await unsharp(iris, lerp(i, 45, 95), 1.2);
    await setBlend(iris, "softLight");
    iris.opacity = lerp(i, 28, 55);
    await finishMask("iris");
    names.push("XT · Íris");

    if (await selectFeature("iris")) {
      await refineSel("iris");
      await bp([{
        _obj: "make",
        _target: [{ _ref: "adjustmentLayer" }],
        using: {
          _obj: "adjustmentLayer",
          type: {
            _obj: "hueSaturation",
            colorize: false,
            adjustment: [{
              _obj: "hueSatAdjustmentV2",
              hue: 0,
              saturation: rnd(lerp(i, 10, 28)),
              lightness: rnd(lerp(i, 2, 8))
            }]
          },
          name: "XT · Cor da íris"
        }
      }]);
      try { await deselect(); } catch (e) {}
      names.push("XT · Cor da íris");
    }

    if (await selectSclera()) {
      await refineSel("sclera");
      await bp([{
        _obj: "make",
        _target: [{ _ref: "adjustmentLayer" }],
        using: {
          _obj: "adjustmentLayer",
          type: {
            _obj: "hueSaturation",
            colorize: false,
            adjustment: [
              { _obj: "hueSatAdjustmentV2", hue: 0, saturation: rnd(lerp(i, -18, -8)), lightness: rnd(lerp(i, 6, 16)) },
              {
                _obj: "hueSatAdjustmentV2",
                localRange: 1,
                beginRamp: 315, beginSustain: 345, endSustain: 15, endRamp: 45,
                hue: 0,
                saturation: rnd(lerp(i, -30, -12)),
                lightness: rnd(lerp(i, 4, 10))
              }
            ]
          },
          name: "XT · Branco do olho"
        }
      }]);
      try { await deselect(); } catch (e) {}
      names.push("XT · Branco do olho");
    }

    try { await groupNamedLayers(names, "XT · Olhos"); } catch (e) {}
  }

  async function bgClean(doc, i, mode) {
    var layer = await stamp(doc, mode === "externa" ? "XT · Fundo externa" : "XT · Fundo limpo", "none");
    await selectSubject();
    await invertSel();
    try {
      await bp([{ _obj: "expand", by: { _unit: "pixelsUnit", _value: 4 } }]);
    } catch (e) {}
    if (mode === "externa") {
      await gauss(layer, lerp(i, 12, 30));
      layer.opacity = lerp(i, 60, 90);
    } else if (mode === "color") {
      await adjWarm(Math.min(100, i + 20));
    } else {
      try {
        await bp([{
          _obj: "fill",
          using: { _enum: "fillContents", _value: "contentAware" },
          opacity: { _unit: "percentUnit", _value: 100 },
          mode: { _enum: "blendMode", _value: "normal" }
        }]);
      } catch (e) {
        await gauss(layer, lerp(i, 4, 12));
      }
    }
    await addMask("selection");
    try { await deselect(); } catch (e) {}
    await selectMask();
  }

  var ACR_LOOK = {
    casamento: { cl: -18, vi: 16, te: 8, ti: 4, hi: -24, sh: 18, cr: 12, tx: 8, dh: 3 },
    quinze: { cl: -22, vi: 22, te: 12, ti: 6, cr: 16, hi: -18, sh: 16, tx: 10, dh: 2 },
    corporativo: { cl: -8, vi: 10, te: 2, ti: 2, cr: 14, hi: -14, sh: 10, tx: 12, dh: 4 },
    beauty: { cl: -26, vi: 18, te: 6, ti: 5, cr: 10, hi: -16, sh: 14, tx: 6, dh: 2 },
    newborn: { cl: -24, cr: 4, vi: 10, te: 14, ti: 6, hi: -8, sh: 22, ex: 0.14, tx: 2, dh: 0 },
    externa: { cl: -12, vi: 14, te: 6, ti: 3, cr: 14, hi: -22, sh: 16, tx: 12, dh: 6 }
  };

  async function look(doc, id, i) {
    var base = await stamp(doc, "XT · " + PROFILES[id].label);
    try {
      await acr(i, ACR_LOOK[id] || {});
    } catch (e) {
      await adjVibrance(i, "XT · Vibrance", "subject");
    }
    await finishMask("reveal");
    var pele = await stamp(doc, "XT · Pele");
    await surface(pele, id === "beauty" ? lerp(i, 12, 28) : lerp(i, 8, 22), rnd(lerp(i, 8, 16)));
    pele.opacity = id === "newborn" ? lerp(i, 22, 42) : lerp(i, 32, 55);
    await finishMask("skin");
    if (id === "quinze" || id === "beauty") {
      var glow = await stamp(doc, "XT · Glow");
      await gauss(glow, lerp(i, 8, 18));
      await setBlend(glow, "screen");
      glow.opacity = lerp(i, 10, 24);
      await finishMask("subject");
    }
    if (id !== "newborn") {
      var n = await stamp(doc, "XT · Nitidez");
      await unsharp(n, lerp(i, 35, 72), 1.15);
      n.opacity = lerp(i, 42, 72);
      await finishMask("subject");
    }
    await adjWarm(id === "corporativo" ? i * 0.5 : i, "skin");
    await adjVibrance(i, "XT · Vibrance", "subject");
    if (id === "externa") await bgClean(doc, i, "externa");
    if (id === "casamento" || id === "corporativo") await bgClean(doc, i * 0.6, "studio");
  }

  async function runKey(doc, key, i) {
    switch (key) {
      case "skinHeal":
      case "remManchas":
      case "mesclagem":
      case "pelePerfeita":
      case "peleDoBruxo":
        await peleXT(doc, i);
        return;
      case "freqSep":
      case "texturaPele":
        await freqSep(doc, i);
        return;
        return;
      case "extratorDetalhes": {
        var e = await stamp(doc, "XT · Extrator");
        await highPass(e, lerp(i, 1.2, 2.8));
        await setBlend(e, "overlay");
        e.opacity = lerp(i, 18, 48);
        await finishMask("subject");
        return;
      }
      case "dodgeBurn":
      case "dodge":
      case "dbCurvas":
        await dodgeBurnPro(doc, i, "subject");
        return;
      case "dbOlhos":
        await dodgeEyes(doc, i);
        return;
      case "burn":
        await dodgeBurnPro(doc, Math.max(20, i * 0.7), "subject");
        return;
      case "olhosContorno":
        await burnEyes(doc, i);
        return;
      case "eyes":
      case "olhosMagicos":
      case "olhosNitidez":
        await eyesPro(doc, i);
        return;
      case "teeth":
      case "dentesBrancos":
        if (!(await selectAI("teeth"))) return;
        await bp([{
          _obj: "make",
          _target: [{ _ref: "adjustmentLayer" }],
          using: {
            _obj: "adjustmentLayer",
            type: {
              _obj: "hueSaturation",
              colorize: false,
              adjustment: [
                { _obj: "hueSatAdjustmentV2" },
                {
                  _obj: "hueSatAdjustmentV2",
                  localRange: 1,
                  beginRamp: 15, beginSustain: 45, endSustain: 75, endRamp: 105,
                  hue: 0,
                  saturation: rnd(lerp(i, -10, -22)),
                  lightness: rnd(lerp(i, 3, 10))
                }
              ]
            },
            name: "XT · Dentes"
          }
        }]);
        try { await deselect(); } catch (e) {}
        return;
      case "grade":
      case "contrasteFinal":
      case "solarCurve":
        await colorGradePro(doc, i);
        return;
      case "glamourGlow": {
        var gl = await stamp(doc, "XT · Glow");
        await gauss(gl, lerp(i, 8, 22));
        await setBlend(gl, "screen");
        gl.opacity = lerp(i, 12, 32);
        await finishMask("subject");
        return;
      }
      case "tomPele":
      case "corIndireta":
        await adjWarm(i, "skin");
        return;
      case "copiarCores":
      case "batom":
      case "volumeBatom":
        await adjVibrance(i, "XT · " + ATOM[key].label, "lips");
        return;
      case "limparFundo":
        await bgClean(doc, i, "studio");
        return;
      case "limparFundoExterna":
        await bgClean(doc, i, "externa");
        return;
      case "colorirFundo":
        await bgClean(doc, i, "color");
        return;
      case "checkLayer": {
        var c = await stamp(doc, "XT · Check");
        await bp([{ _obj: "blackAndWhite", presetKind: { _enum: "presetKindType", _value: "presetKindDefault" } }]);
        c.opacity = lerp(i, 50, 100);
        await finishMask("reveal");
        return;
      }
      case "nitidez12":
      case "superNitidez": {
        var sh = await stamp(doc, "XT · " + ATOM[key].label);
        await unsharp(sh, key === "superNitidez" ? lerp(i, 70, 140) : lerp(i, 35, 80), key === "superNitidez" ? 1.6 : 1.1);
        sh.opacity = lerp(i, 40, 85);
        await finishMask("subject");
        return;
      }
      case "grao": {
        var gr = await stamp(doc, "XT · Grão");
        if (typeof gr.applyAddNoise === "function") await gr.applyAddNoise(lerp(i, 2, 7), "gaussian", true);
        else await bp([{
          _obj: "addNoise",
          amount: { _unit: "percentUnit", _value: lerp(i, 2, 7) },
          distribution: { _enum: "distribution", _value: "gaussian" },
          monochromatic: true
        }]);
        await setBlend(gr, "overlay");
        gr.opacity = lerp(i, 18, 42);
        await finishMask("reveal");
        return;
      }
      case "desfoque":
        await bgClean(doc, i, "externa");
        return;
      case "destaque": {
        var d = await stamp(doc, "XT · Destaque");
        await bp([{
          _obj: "brightnessEvent",
          brightness: rnd(lerp(i, 4, 14)),
          contrast: rnd(lerp(i, 2, 10)),
          useLegacy: false
        }]);
        await finishMask("subject");
        return;
      }
      case "escurecer":
      case "contrasteFundo":
      case "luzBaixa": {
        var b = await stamp(doc, "XT · " + ATOM[key].label);
        await bp([{
          _obj: "brightnessEvent",
          brightness: rnd(lerp(i, -8, -22)),
          contrast: rnd(lerp(i, 4, 14)),
          useLegacy: false
        }]);
        await finishMask("background");
        return;
      }
      case "remCabeloRosto": {
        var h = await stamp(doc, "XT · Cabelo");
        if (typeof h.applyDustAndScratches === "function") await h.applyDustAndScratches(rnd(lerp(i, 2, 6)), 8);
        else await surface(h, lerp(i, 3, 8), 6);
        h.opacity = lerp(i, 20, 45);
        await finishMask("hair");
        return;
      }
      case "olhosTrocarCor":
        if (!(await selectAI("eyes"))) return;
        await bp([{
          _obj: "make",
          _target: [{ _ref: "adjustmentLayer" }],
          using: {
            _obj: "adjustmentLayer",
            type: {
              _obj: "hueSaturation",
              colorize: false,
              adjustment: [{ _obj: "hueSatAdjustmentV2", hue: rnd(lerp(i, -24, 24)), saturation: 8 }]
            },
            name: "XT · Trocar cor"
          }
        }]);
        try { await deselect(); } catch (e) {}
        return;
      case "batomTrocarCor":
        await selectAI("lips");
        await bp([{
          _obj: "make",
          _target: [{ _ref: "adjustmentLayer" }],
          using: {
            _obj: "adjustmentLayer",
            type: {
              _obj: "hueSaturation",
              colorize: false,
              adjustment: [{ _obj: "hueSatAdjustmentV2", hue: rnd(lerp(i, -24, 24)), saturation: 8 }]
            },
            name: "XT · " + ATOM[key].label
          }
        }]);
        try { await deselect(); } catch (e) {}
        return;
      default: {
        var x = await stamp(doc, "XT · " + (ATOM[key] ? ATOM[key].label : key));
        try { await acr(i); } catch (e) { await adjVibrance(i); }
        await finishMask("reveal");
      }
    }
  }

  async function exportDoc(kind) {
    if (!app.documents.length) throw new Error("Abra um documento.");
    var fs = uxp.storage.localFileSystem;
    var isPng = kind === "png";
    var file = await fs.getFileForSaving(isPng ? "xtreme.png" : "xtreme.jpg", { types: [isPng ? "png" : "jpg"] });
    if (!file) return;
    await core.executeAsModal(async function () {
      if (isPng) await app.activeDocument.saveAs.png(file);
      else await app.activeDocument.saveAs.jpg(file, { quality: kind === "web" ? 8 : 12 }, true);
    }, { commandName: "Xtreme · Salvar" });
  }

  async function runAtom(key) {
    var def = ATOM[key];
    try {
      if (def.exportKind) {
        if (def.exportKind === "save") {
          if (!app.documents.length) throw new Error("Abra um documento.");
          await core.executeAsModal(async function () { await app.activeDocument.save(); }, { commandName: "Xtreme · Salvar" });
        } else await exportDoc(def.exportKind);
        setStatus(def.label);
        return;
      }
      setStatus("Aplicando " + def.label + "…");
      await runModal("Xtreme · " + def.label, async function (doc) {
        await runKey(doc, key, state.intensity);
      });
      setStatus(def.label + " · " + state.intensity + "%");
    } catch (err) {
      setStatus(err.message || String(err), true);
    }
  }

  async function runLook() {
    var keys = selectedKeys();
    if (!keys.length) {
      setStatus("Marque as funções no plugin", true);
      return;
    }
    try {
      setStatus("Foto atual · " + keys.length + " funções…");
      await runModal("Xtreme · Foto pronta", async function (doc) {
        await applyKeysToDoc(doc, keys, state.intensity);
      });
      setStatus("Foto pronta · " + keys.length + " · um undo");
    } catch (err) {
      setStatus(err.message || String(err), true);
    }
  }

  function selectedKeys() {
    var seen = {};
    var keys = [];
    document.querySelectorAll("[data-lote]").forEach(function (cb) {
      if (!cb.checked) return;
      var key = cb.getAttribute("data-lote");
      if (!key || seen[key]) return;
      if (ATOM[key] && ATOM[key].exportKind) return;
      seen[key] = true;
      keys.push(key);
    });
    return keys;
  }

  async function applyKeysToDoc(doc, keys, intensity) {
    for (var n = 0; n < keys.length; n++) {
      try {
        await runKey(doc, keys[n], intensity);
      } catch (e) {}
    }
  }

  function listDocs() {
    var docs = [];
    for (var i = 0; i < app.documents.length; i++) docs.push(app.documents[i]);
    return docs;
  }

  async function activateDoc(doc) {
    try {
      app.activeDocument = doc;
    } catch (e) {
      await bp([{ _obj: "select", _target: [{ _ref: "document", _id: doc.id }] }]);
    }
  }

  function loteCount() {
    return selectedKeys().length;
  }
  function refreshLote() {
    var el = document.getElementById("runBatch");
    if (el) el.textContent = "Lote todas (" + loteCount() + ")";
  }

  async function runLote() {
    var keys = selectedKeys();
    if (!keys.length) {
      setStatus("Marque as funções no plugin", true);
      return;
    }
    if (!app.documents.length) {
      setStatus("Abra as fotos no Photoshop", true);
      return;
    }
    var docs = listDocs();
    try {
      setStatus("Lote · " + docs.length + " fotos…");
      await core.executeAsModal(async function (ctx) {
        var ok = 0;
        var fail = 0;
        for (var n = 0; n < docs.length; n++) {
          var doc = docs[n];
          setStatus("Lote " + (n + 1) + "/" + docs.length + " · " + (doc.title || doc.name || "foto"));
          await activateDoc(doc);
          var token = await ctx.hostControl.suspendHistory({
            documentID: doc.id,
            name: "Xtreme · Lote"
          });
          try {
            await promoteBackground(doc);
            try { await deselect(); } catch (e) {}
            await applyKeysToDoc(doc, keys, state.intensity);
            ok += 1;
          } catch (e) {
            fail += 1;
          } finally {
            await ctx.hostControl.resumeHistory(token);
          }
        }
        setStatus("Lote · " + ok + " fotos" + (fail ? " · " + fail + " falhas" : "") + " · um undo cada");
      }, { commandName: "Xtreme · Lote todas" });
    } catch (err) {
      setStatus(err.message || String(err), true);
    }
  }

  function bind() {
    document.querySelectorAll("[data-profile]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        applyClass(chip.getAttribute("data-profile"));
      });
    });
    var range = document.getElementById("intensity");
    if (range) {
      range.addEventListener("input", function (e) {
        state.intensity = Number(e.target.value);
        document.getElementById("intVal").textContent = String(state.intensity);
      });
    }
    document.querySelectorAll("[data-recipe]").forEach(function (btn) {
      btn.addEventListener("click", function () { runAtom(btn.getAttribute("data-recipe")); });
    });
    document.querySelectorAll("[data-lote]").forEach(function (cb) {
      cb.addEventListener("change", refreshLote);
    });
    document.querySelectorAll("[data-lote-sec]").forEach(function (tog) {
      tog.addEventListener("click", function (e) {
        if (e.stopPropagation) e.stopPropagation();
        var sec = tog.parentElement.parentElement;
        var boxes = sec.querySelectorAll("[data-lote]");
        var allOn = boxes.length && Array.prototype.every.call(boxes, function (b) { return b.checked; });
        Array.prototype.forEach.call(boxes, function (b) { b.checked = !allOn; });
        tog.textContent = !allOn ? "Lote off" : "Lote seção";
        refreshLote();
      });
    });
    document.querySelectorAll("[data-toggle]").forEach(function (head) {
      head.addEventListener("click", function (e) {
        if (e.target && e.target.getAttribute && e.target.getAttribute("data-lote-sec")) return;
        var sec = head.parentElement;
        var open = String(sec.className).indexOf("open") >= 0;
        sec.className = open ? "sec closed" : "sec open";
        var chev = head.querySelector(".chev");
        if (chev) chev.textContent = open ? "▸" : "▾";
      });
    });
    document.querySelectorAll("[data-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var id = tab.getAttribute("data-tab");
        document.querySelectorAll("[data-tab]").forEach(function (t) {
          t.className = t.getAttribute("data-tab") === id ? "tab active" : "tab";
        });
        document.querySelectorAll("[data-sec]").forEach(function (sec) {
          var on = sec.getAttribute("data-sec") === id;
          sec.className = on ? "sec open" : "sec closed";
          var chev = sec.querySelector(".chev");
          if (chev) chev.textContent = on ? "▾" : "▸";
        });
      });
    });
    var allBtn = document.getElementById("loteAll");
    var noneBtn = document.getElementById("loteNone");
    if (allBtn) allBtn.addEventListener("click", function () {
      document.querySelectorAll("[data-lote]").forEach(function (cb) { cb.checked = true; });
      refreshLote();
    });
    if (noneBtn) noneBtn.addEventListener("click", function () {
      document.querySelectorAll("[data-lote]").forEach(function (cb) { cb.checked = false; });
      refreshLote();
    });
    document.getElementById("applyProfile").addEventListener("click", function () { runLook(); });
    document.getElementById("runBatch").addEventListener("click", function () { runLote(); });
    applyClass(state.profile);
  }

  try { bind(); } catch (err) { setStatus("Falha ao ligar UI: " + err.message, true); }
  }

  setTimeout(start, 0);
})();
