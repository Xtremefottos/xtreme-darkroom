(function () {
  var statusEl = document.getElementById("status");
  function setStatus(msg, isError) {
    statusEl.textContent = msg;
    statusEl.parentElement.classList.toggle("error", !!isError);
  }

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
  var constants = photoshop.constants;
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
    { key: "peleDoBruxo", label: "Pele do Bruxo" },
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
    casamento: ["pelePerfeita", "freqSep", "dodge", "olhosMagicos", "dentesBrancos", "contrasteFinal", "limparFundo", "tomPele"],
    quinze: ["pelePerfeita", "glamourGlow", "olhosMagicos", "dentesBrancos", "batom", "contrasteFinal", "nitidez12"],
    corporativo: ["remManchas", "freqSep", "eyes", "contrasteFinal", "limparFundo", "nitidez12"],
    beauty: ["peleDoBruxo", "freqSep", "glamourGlow", "olhosMagicos", "dentesBrancos", "batom", "contrasteFinal"],
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
      if (!d._options) d._options = { dialogOptions: "dontDisplay" };
      return d;
    });
    return action.batchPlay(cmds, {});
  }

  async function runModal(name, fn) {
    if (!app.documents.length) throw new Error("Abra um documento.");
    await core.executeAsModal(async function (ctx) {
      var doc = app.activeDocument;
      var host = ctx.hostControl;
      var token = await host.suspendHistory({ documentID: doc.id, name: name });
      try {
        await fn(doc);
      } finally {
        await host.resumeHistory(token);
      }
    }, { commandName: name });
  }


  async function addMask(kind) {
    var using = "revealAll";
    if (kind === "selection") using = "revealSelection";
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

  var PEOPLE_TAGS = {
    skin: ["Facial skin", "Upper body skin", "Face Skin", "Skin"],
    eyes: ["Eyes", "Iris", "Eye"],
    teeth: ["Teeth"],
    lips: ["Lips", "Mouth", "Lip"],
    hair: ["Hair"],
    brows: ["Eyebrows", "Eyebrow"]
  };

  async function selectAI(kind) {
    try { await deselect(); } catch (e) {}
    if (kind === "sky") return await selectSkyAI();
    if (kind === "background") {
      if (await selectAI("subject")) {
        await invertSel();
        try { await bp([{ _obj: "expand", by: { _unit: "pixelsUnit", _value: 4 } }]); } catch (e) {}
        return true;
      }
      return false;
    }
    if (kind === "subject") {
      if (await selectPeopleAI(null)) return true;
      await selectSubject();
      return await hasSelection();
    }
    var tags = PEOPLE_TAGS[kind];
    if (tags && await selectPeopleAI(tags)) return true;
    if (kind === "skin") {
      try {
        await bp([{
          _obj: "colorRange",
          colors: { _enum: "colors", _value: "skinTones" },
          fuzziness: 80
        }]);
        if (await hasSelection()) return true;
      } catch (e) {}
    }
    await selectSubject();
    return await hasSelection();
  }

  async function finishMask(kind) {
    try {
      if (!kind || kind === "reveal") {
        await addMask("reveal");
        try { await deselect(); } catch (e) {}
        return;
      }
      var ok = await selectAI(kind);
      if (ok) {
        try { await bp([{ _obj: "feather", radius: { _unit: "pixelsUnit", _value: 4 } }]); } catch (e) {}
        await addMask("selection");
      } else {
        await addMask("reveal");
      }
    } catch (e) {
      await addMask("reveal");
    }
    try { await deselect(); } catch (e) {}
  }

  async function stamp(doc, name) {
    await bp([{ _obj: "mergeVisible", duplicate: true }]);
    var layer = doc.activeLayers[0];
    if (!layer) throw new Error("Não copiou a imagem. Desbloqueie o fundo e tente de novo.");
    layer.name = name;
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
    await bp([{
      _obj: "Adobe Camera Raw Filter",
      "$CrVe": "15.4",
      "$PrVN": 5,
      "$PrVe": 184549376,
      "$Ex12": extra.ex != null ? extra.ex : 0.05 + t(i) * 0.12,
      "$Cr12": extra.cr != null ? extra.cr : rnd(lerp(i, 8, 18)),
      "$Hi12": extra.hi != null ? extra.hi : rnd(lerp(i, -16, -32)),
      "$Sh12": extra.sh != null ? extra.sh : rnd(lerp(i, 12, 28)),
      "$Wh12": extra.wh != null ? extra.wh : rnd(lerp(i, 4, 12)),
      "$Bk12": extra.bk != null ? extra.bk : rnd(lerp(i, -6, -12)),
      "$Cl12": extra.cl != null ? extra.cl : rnd(lerp(i, -8, -22)),
      "$Vibr": extra.vi != null ? extra.vi : rnd(lerp(i, 8, 18)),
      "$Strt": extra.st != null ? extra.st : rnd(lerp(i, 2, 6)),
      "$Temp": extra.te != null ? extra.te : rnd(lerp(i, 4, 12))
    }]);
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

  async function freqSep(doc, radius) {
    var hf = await stamp(doc, "XT · HF");
    await hf.duplicate();
    var lf = doc.activeLayers[0];
    lf.name = "XT · LF";
    await gauss(lf, radius);
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
    await addMask("reveal");
  }

  async function neuralSkin(doc, i) {
    var layer = await stamp(doc, "XT · Pele IA");
    try {
      await bp([{
        _obj: "neuralGalleryFilters",
        NF_UI_DATA: {
          "spl::filterStack": [{
            "spl::filterType": "skinSmoothing",
            "spl::cropStates": [{
              "spl::values": {
                smoothness: rnd(lerp(i, 25, 70)),
                blur: rnd(lerp(i, 8, 22)),
                skinDetectionMode: 1
              }
            }]
          }]
        }
      }]);
    } catch (e) {
      await surface(layer, lerp(i, 10, 24), rnd(lerp(i, 8, 18)));
    }
    layer.opacity = lerp(i, 55, 85);
  }

  async function grayDB(doc, name) {
    await bp([{ _obj: "make", _target: [{ _ref: "layer" }] }]);
    var layer = doc.activeLayers[0];
    layer.name = name;
    await fillGray();
    await setBlend(layer, "softLight");
    await addMask("reveal");
    return layer;
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
    casamento: { cl: -18, vi: 14, te: 8, hi: -22, sh: 18, cr: 12 },
    quinze: { cl: -22, vi: 20, te: 12, cr: 16, hi: -18, sh: 16 },
    corporativo: { cl: -8, vi: 8, te: 2, cr: 12, hi: -12, sh: 10 },
    beauty: { cl: -26, vi: 16, te: 6, cr: 10, hi: -16, sh: 14 },
    newborn: { cl: -24, cr: 4, vi: 8, te: 14, hi: -8, sh: 22, ex: 0.12 },
    externa: { cl: -12, vi: 12, te: 6, cr: 14, hi: -20, sh: 16 }
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
      case "mesclagem": {
        var s = await stamp(doc, "XT · " + ATOM[key].label);
        await surface(s, lerp(i, 8, 24), rnd(lerp(i, 8, 18)));
        s.opacity = lerp(i, 28, 62);
        await finishMask("skin");
        return;
      }
      case "pelePerfeita":
      case "peleDoBruxo":
        await neuralSkin(doc, i);
        return;
      case "freqSep":
      case "texturaPele":
        await freqSep(doc, lerp(i, 3.5, 10));
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
        await grayDB(doc, "XT · D&B", i);
        return;
      case "dodge":
        await adjCurvesUp("XT · Dodge", "skin");
        return;
      case "dbOlhos":
        await adjCurvesUp("XT · Dodge", "eyes");
        return;
      case "burn":
        await adjCurvesDown("XT · Burn", "skin");
        return;
      case "olhosContorno":
        await adjCurvesDown("XT · Burn", "eyes");
        return;
      case "dbCurvas":
        await adjCurvesUp("XT · Dodge");
        await adjCurvesDown("XT · Burn");
        return;
      case "eyes":
      case "olhosMagicos":
      case "olhosNitidez": {
        var o = await stamp(doc, "XT · Olhos");
        await unsharp(o, lerp(i, 40, 90), 1.3);
        await setBlend(o, "softLight");
        o.opacity = lerp(i, 22, 50);
        await finishMask("eyes");
        return;
      }
      case "teeth":
      case "dentesBrancos":
        await selectAI("teeth");
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
      case "solarCurve": {
        var g = await stamp(doc, "XT · " + ATOM[key].label);
        try { await acr(i); } catch (err) { await adjVibrance(i, "XT · Vibrance", "subject"); }
        await finishMask("reveal");
        return;
      }
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
        await selectAI("eyes");
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
      await runKey(doc, keys[n], intensity);
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
})();
