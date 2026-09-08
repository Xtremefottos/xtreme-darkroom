(function () {
  const statusEl = document.getElementById("status");

  function setStatus(msg, isError) {
    statusEl.textContent = msg;
    statusEl.parentElement.classList.toggle("error", !!isError);
  }

  let photoshop;
  try {
    photoshop = require("photoshop");
  } catch (err) {
    setStatus("Photoshop API indisponível: " + err.message, true);
    return;
  }

  const { core, action, app } = photoshop;
  const uxp = require("uxp");

  const state = {
    profile: "casamento",
    intensity: 50,
    batch: {
      pelePerfeita: true,
      freqSep: true,
      dodge: true,
      olhosMagicos: true,
      dentesBrancos: true,
      contrasteFinal: true
    }
  };

  const ATOMS = [
    { key: "skinHeal", label: "Pele", group: "XT · Pele" },
    { key: "freqSep", label: "Frequência", group: "XT · Frequência" },
    { key: "dodgeBurn", label: "D&B", group: "XT · D&B" },
    { key: "eyes", label: "Olhos", group: "XT · Olhos" },
    { key: "teeth", label: "Dentes", group: "XT · Dentes" },
    { key: "grade", label: "Cor", group: "XT · Grade" },
    { key: "pelePerfeita", label: "Pele perfeita", group: "XT · Pele perfeita" },
    { key: "mesclagem", label: "Mesclagem", group: "XT · Mesclagem" },
    { key: "copiarCores", label: "Copiar cores", group: "XT · Copiar cores" },
    { key: "limparFundo", label: "Limpar fundo de estúdio", group: "XT · Fundo limpo" },
    { key: "limparFundoExterna", label: "Limpar fundo externa", group: "XT · Fundo externa" },
    { key: "colorirFundo", label: "Colorir fundo de estúdio", group: "XT · Fundo cor" },
    { key: "texturaPele", label: "Textura de pele", group: "XT · Textura" },
    { key: "remManchas", label: "Rem. manchas", group: "XT · Manchas" },
    { key: "peleDoBruxo", label: "Pele do Bruxo", group: "XT · Pele do Bruxo" },
    { key: "glamourGlow", label: "Glamour glow", group: "XT · Glow" },
    { key: "tomPele", label: "Tom de pele", group: "XT · Tom de pele" },
    { key: "remCabeloRosto", label: "Remover cabelo do rosto", group: "XT · Cabelo" },
    { key: "checkLayer", label: "Check layer", group: "XT · Check" },
    { key: "solarCurve", label: "Solar curve", group: "XT · Solar" },
    { key: "dbCurvas", label: "DB curvas", group: "XT · DB curvas" },
    { key: "dodge", label: "Dodge", group: "XT · Dodge" },
    { key: "burn", label: "Burn", group: "XT · Burn" },
    { key: "olhosTrocarCor", label: "Trocar cor", group: "XT · Cor dos olhos" },
    { key: "olhosMagicos", label: "Olhos mágicos", group: "XT · Olhos mágicos" },
    { key: "dbOlhos", label: "DB olhos", group: "XT · DB olhos" },
    { key: "olhosNitidez", label: "Nitidez", group: "XT · Nitidez olhos" },
    { key: "olhosContorno", label: "Contorno", group: "XT · Contorno olhos" },
    { key: "dentesBrancos", label: "Dentes brancos", group: "XT · Dentes" },
    { key: "batom", label: "Batom", group: "XT · Batom" },
    { key: "batomTrocarCor", label: "Trocar cor", group: "XT · Cor batom" },
    { key: "volumeBatom", label: "Volume do batom", group: "XT · Volume batom" },
    { key: "extratorDetalhes", label: "Extrator de detalhes", group: "XT · Extrator" },
    { key: "grao", label: "Grão", group: "XT · Grão" },
    { key: "nitidez12", label: "Nitidez 1.2", group: "XT · Nitidez 1.2" },
    { key: "superNitidez", label: "Super nitidez", group: "XT · Super nitidez" },
    { key: "desfoque", label: "Desfoque", group: "XT · Desfoque" },
    { key: "destaque", label: "Destaque", group: "XT · Destaque" },
    { key: "contrasteFundo", label: "Contraste de fundo", group: "XT · Contraste fundo" },
    { key: "corIndireta", label: "Cor indireta", group: "XT · Cor indireta" },
    { key: "escurecer", label: "Escurecer", group: "XT · Escurecer" },
    { key: "luzBaixa", label: "Luz baixa", group: "XT · Luz baixa" },
    { key: "contrasteFinal", label: "Contraste final", group: "XT · Contraste final" },
    { key: "salvarFoto", label: "Salvar foto", group: "XT · Salvar", exportKind: "save" },
    { key: "salvarComo", label: "Salvar como", group: "XT · Salvar como", exportKind: "jpg" },
    { key: "salvarInternet", label: "Salvar para internet", group: "XT · Web", exportKind: "web" }
  ];
  const ATOM = {};
  ATOMS.forEach(function (a) { ATOM[a.key] = a; });

  const SECTIONS = [
    { id: "rapidos", label: "Rápidos", keys: ["skinHeal", "freqSep", "dodgeBurn", "eyes", "teeth", "grade"] },
    { id: "estudio", label: "Estúdio", keys: ["pelePerfeita", "mesclagem", "copiarCores", "limparFundo", "limparFundoExterna", "colorirFundo"] },
    { id: "pele", label: "Pele", keys: ["texturaPele", "remManchas", "freqSep", "peleDoBruxo", "glamourGlow", "tomPele", "remCabeloRosto"] },
    { id: "db", label: "Dodge and burn", keys: ["checkLayer", "solarCurve", "dbCurvas", "dodge", "burn"] },
    { id: "olhos", label: "Olhos", keys: ["olhosTrocarCor", "olhosMagicos", "dbOlhos", "olhosNitidez", "olhosContorno"] },
    { id: "boca", label: "Batom e dentes", keys: ["dentesBrancos", "batom", "batomTrocarCor", "volumeBatom"] },
    { id: "detalhes", label: "Detalhes", keys: ["extratorDetalhes", "grao", "nitidez12", "superNitidez"] },
    { id: "desfoque", label: "Desfoque", keys: ["desfoque", "destaque"] },
    { id: "final", label: "Finalização", keys: ["contrasteFundo", "corIndireta", "escurecer", "luzBaixa", "contrasteFinal"] },
    { id: "salvar", label: "Salvamento", keys: ["salvarFoto", "salvarComo", "salvarInternet"] }
  ];

  const PROFILES = {
    casamento: { label: "Casamento", stack: [["pelePerfeita", 45], ["freqSep", 40], ["dodge", 30], ["burn", 28], ["olhosMagicos", 30], ["dentesBrancos", 25], ["contrasteFinal", 30]] },
    quinze: { label: "15 anos", stack: [["peleDoBruxo", 55], ["glamourGlow", 35], ["freqSep", 50], ["dodge", 35], ["olhosMagicos", 45], ["batom", 40], ["dentesBrancos", 35], ["contrasteFinal", 40]] },
    corporativo: { label: "Corporativo", stack: [["pelePerfeita", 30], ["freqSep", 28], ["dodge", 20], ["olhosNitidez", 22], ["contrasteFinal", 18]] },
    beauty: { label: "Beauty", stack: [["peleDoBruxo", 60], ["texturaPele", 40], ["freqSep", 55], ["glamourGlow", 30], ["olhosMagicos", 50], ["batom", 45], ["superNitidez", 28]] },
    newborn: { label: "Newborn", stack: [["pelePerfeita", 35], ["tomPele", 28], ["freqSep", 25], ["luzBaixa", 20], ["contrasteFinal", 22]] },
    externa: { label: "Externa", stack: [["pelePerfeita", 32], ["limparFundoExterna", 55], ["destaque", 28], ["dodge", 22], ["contrasteFinal", 24]] }
  };


  function scale(i, min, max) { return min + (max - min) * (i / 100); }
  function rnd(n) { return Math.round(n); }
  function D(obj) {
    obj._options = { dialogOptions: "dontDisplay" };
    return obj;
  }
  function stamp(name) {
    return [
      D({ _obj: "mergeVisible", duplicate: true }),
      D({
        _obj: "set",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: { _obj: "layer", name: name }
      })
    ];
  }
  function opacity(pct) {
    return D({
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", opacity: { _unit: "percentUnit", _value: pct } }
    });
  }
  function blend(mode) {
    return D({
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", mode: { _enum: "blendMode", _value: mode } }
    });
  }
  function acr(i, extra) {
    extra = extra || {};
    var t = i / 100;
    return D({
      _obj: "Adobe Camera Raw Filter",
      "$CrVe": "15.4",
      "$PrVN": 5,
      "$PrVe": 184549376,
      "$Ex12": extra.ex != null ? extra.ex : 0.08 + t * 0.12,
      "$Cr12": extra.cr != null ? extra.cr : rnd(8 + t * 14),
      "$Hi12": extra.hi != null ? extra.hi : rnd(-18 - t * 18),
      "$Sh12": extra.sh != null ? extra.sh : rnd(14 + t * 16),
      "$Wh12": extra.wh != null ? extra.wh : rnd(4 + t * 8),
      "$Bk12": extra.bk != null ? extra.bk : rnd(-6 - t * 6),
      "$Cl12": extra.cl != null ? extra.cl : rnd(-10 - t * 16),
      "$Vibr": extra.vi != null ? extra.vi : rnd(10 + t * 10),
      "$Strt": extra.st != null ? extra.st : rnd(2 + t * 4),
      "$Temp": extra.te != null ? extra.te : rnd(5 + t * 8)
    });
  }
  function surface(i) {
    return D({
      _obj: "surfaceBlur",
      radius: { _unit: "pixelsUnit", _value: scale(i, 8, 26) },
      threshold: rnd(scale(i, 8, 20))
    });
  }
  function gauss(r) {
    return D({ _obj: "gaussianBlur", radius: { _unit: "pixelsUnit", _value: r } });
  }
  function highPass(r) {
    return D({ _obj: "highPass", radius: { _unit: "pixelsUnit", _value: r } });
  }
  function unsharp(amt, rad) {
    return D({
      _obj: "unsharpMask",
      amount: { _unit: "percentUnit", _value: amt },
      radius: { _unit: "pixelsUnit", _value: rad },
      threshold: 3
    });
  }
  function shadowsHighlights(i) {
    return D({
      _obj: "shadowHighlight",
      shadowAmount: rnd(scale(i, 8, 22)),
      shadowWidth: 50,
      shadowRadius: 30,
      highlightAmount: rnd(scale(i, 6, 16)),
      highlightWidth: 50,
      highlightRadius: 30,
      colorCorrection: 15,
      midtoneContrast: rnd(scale(i, 2, 8)),
      blackClip: 0.01,
      whiteClip: 0.01
    });
  }
  function photoWarm(i) {
    return D({
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "photoFilter",
          color: { _obj: "RGBColor", red: 236, grain: 138, blue: 0 },
          density: rnd(scale(i, 6, 16)),
          preserveLuminosity: true
        },
        name: "XT · Tom quente"
      }
    });
  }
  function vibranceAdj(i) {
    return D({
      _obj: "make",
      _target: [{ _ref: "adjustmentLayer" }],
      using: {
        _obj: "adjustmentLayer",
        type: {
          _obj: "vibrance",
          vibrance: rnd(scale(i, 8, 22)),
          saturation: rnd(scale(i, 1, 6))
        },
        name: "XT · Vibrance"
      }
    });
  }
  function hueYellows(i) {
    return D({
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
              beginRamp: 15,
              beginSustain: 45,
              endSustain: 75,
              endRamp: 105,
              hue: 0,
              saturation: rnd(scale(i, -10, -22)),
              lightness: rnd(scale(i, 3, 10))
            }
          ]
        },
        name: "XT · Dentes"
      }
    });
  }
  function subject() { return D({ _obj: "autoCutout", sampleAllLayers: true }); }
  function inverse() { return D({ _obj: "inverse" }); }
  function deselect() {
    return D({
      _obj: "set",
      _target: [{ _ref: "channel", _property: "selection" }],
      to: { _enum: "ordinal", _value: "none" }
    });
  }
  function rec(title, descriptors) { return { title: title, descriptors: descriptors }; }

  var ACR_LOOK = {
    casamento: { cl: -18, vi: 14, te: 8, hi: -22, sh: 18, cr: 12 },
    quinze: { cl: -22, vi: 20, te: 12, cr: 16, hi: -18, sh: 16 },
    corporativo: { cl: -8, vi: 8, te: 2, cr: 12, hi: -12, sh: 10 },
    beauty: { cl: -26, vi: 16, te: 6, cr: 10, hi: -16, sh: 14 },
    newborn: { cl: -24, cr: 4, vi: 8, te: 14, hi: -8, sh: 22, ex: 0.12 },
    externa: { cl: -12, vi: 12, te: 6, cr: 14, hi: -20, sh: 16 }
  };

  function lookDescriptors(id, i) {
    var d = [];
    d = d.concat(stamp("XT · " + (PROFILES[id] ? PROFILES[id].label : "Look")));
    d.push(acr(i, ACR_LOOK[id] || {}));
    d = d.concat(stamp("XT · Pele"));
    d.push(surface(id === "beauty" ? Math.min(100, i + 12) : id === "corporativo" ? i * 0.75 : i));
    d.push(opacity(id === "newborn" ? scale(i, 22, 40) : scale(i, 32, 55)));
    if (id === "quinze" || id === "beauty") {
      d = d.concat(stamp("XT · Glow"));
      d.push(gauss(scale(i, 8, 18)));
      d.push(blend("screen"));
      d.push(opacity(scale(i, 10, 24)));
    }
    if (id !== "newborn") {
      d = d.concat(stamp("XT · Nitidez"));
      d.push(unsharp(scale(i, 35, 72), 1.15));
      d.push(opacity(scale(i, 42, 72)));
    }
    d.push(photoWarm(id === "corporativo" ? i * 0.5 : i));
    d.push(vibranceAdj(i));
    if (id === "externa") {
      d.push(subject());
      d.push(inverse());
      d = d.concat(stamp("XT · Fundo externa"));
      d.push(gauss(scale(i, 12, 28)));
      d.push(opacity(scale(i, 60, 88)));
      d.push(deselect());
    }
    if (id === "casamento" || id === "corporativo") {
      d.push(subject());
      d.push(inverse());
      d = d.concat(stamp("XT · Fundo"));
      d.push(D({
        _obj: "brightnessEvent",
        brightness: rnd(scale(i, 2, 8)),
        contrast: rnd(scale(i, 2, 10)),
        useLegacy: false
      }));
      d.push(deselect());
    }
    return d;
  }

  function recipe(key, i) {
    switch (key) {
      case "skinHeal":
      case "pelePerfeita":
      case "peleDoBruxo":
      case "remManchas":
      case "mesclagem":
        return rec(ATOM[key].label, stamp(ATOM[key].group).concat([surface(i), opacity(scale(i, 28, 62))]));
      case "remCabeloRosto":
        return rec("Cabelo", stamp("XT · Cabelo").concat([
          D({ _obj: "dustAndScratches", radius: rnd(scale(i, 2, 6)), threshold: 8 }),
          opacity(scale(i, 20, 45))
        ]));
      case "freqSep":
      case "texturaPele":
      case "extratorDetalhes":
        return rec(ATOM[key].label, stamp(ATOM[key].group).concat([
          highPass(scale(i, 1.2, 2.8)),
          blend("overlay"),
          opacity(scale(i, 18, 48))
        ]));
      case "dodgeBurn":
      case "dodge":
      case "dbOlhos":
      case "dbCurvas":
      case "solarCurve":
        return rec(ATOM[key].label, stamp(ATOM[key].group).concat([
          shadowsHighlights(i),
          blend("softLight"),
          opacity(scale(i, 40, 85))
        ]));
      case "burn":
      case "escurecer":
      case "contrasteFundo":
      case "luzBaixa":
        return rec(ATOM[key].label, [subject(), inverse()].concat(stamp(ATOM[key].group), [
          D({
            _obj: "brightnessEvent",
            brightness: rnd(scale(i, -8, -22)),
            contrast: rnd(scale(i, 4, 14)),
            useLegacy: false
          }),
          deselect()
        ]));
      case "eyes":
      case "olhosMagicos":
        return rec(ATOM[key].label, stamp(ATOM[key].group).concat([
          unsharp(scale(i, 40, 90), 1.3),
          blend("softLight"),
          opacity(scale(i, 22, 50))
        ]));
      case "olhosNitidez":
      case "nitidez12":
      case "superNitidez":
        return rec(ATOM[key].label, stamp(ATOM[key].group).concat([
          unsharp(key === "superNitidez" ? scale(i, 70, 140) : scale(i, 35, 80), key === "superNitidez" ? 1.6 : 1.1),
          opacity(scale(i, 40, 85))
        ]));
      case "teeth":
      case "dentesBrancos":
        return rec(ATOM[key].label, [hueYellows(i)]);
      case "grade":
      case "contrasteFinal":
        return rec(ATOM[key].label, stamp(ATOM[key].group).concat([acr(i)]));
      case "glamourGlow":
        return rec("Glow", stamp("XT · Glow").concat([gauss(scale(i, 8, 22)), blend("screen"), opacity(scale(i, 12, 32))]));
      case "tomPele":
      case "corIndireta":
        return rec(ATOM[key].label, [photoWarm(i)]);
      case "copiarCores":
        return rec("Copiar cores", [vibranceAdj(i)]);
      case "limparFundo":
        return rec("Fundo estúdio", [subject(), inverse()].concat(stamp("XT · Fundo limpo"), [
          D({
            _obj: "hueSaturation",
            colorize: false,
            adjustment: [{ _obj: "hueSatAdjustmentV2", saturation: rnd(scale(i, -20, -50)), lightness: rnd(scale(i, 4, 14)) }]
          }),
          deselect()
        ]));
      case "limparFundoExterna":
        return rec("Fundo externa", [subject(), inverse()].concat(stamp("XT · Fundo externa"), [
          gauss(scale(i, 10, 32)),
          opacity(scale(i, 55, 90)),
          deselect()
        ]));
      case "colorirFundo":
        return rec("Fundo cor", [subject(), inverse()].concat(stamp("XT · Fundo cor"), [photoWarm(Math.min(100, i + 20)), deselect()]));
      case "checkLayer":
        return rec("Check", stamp("XT · Check").concat([
          D({ _obj: "blackAndWhite", presetKind: { _enum: "presetKindType", _value: "presetKindDefault" } }),
          opacity(scale(i, 50, 100))
        ]));
      case "olhosTrocarCor":
      case "batomTrocarCor":
        return rec(ATOM[key].label, [D({
          _obj: "make",
          _target: [{ _ref: "adjustmentLayer" }],
          using: {
            _obj: "adjustmentLayer",
            type: {
              _obj: "hueSaturation",
              colorize: false,
              adjustment: [{ _obj: "hueSatAdjustmentV2", hue: rnd(scale(i, -24, 24)), saturation: 8 }]
            },
            name: ATOM[key].group
          }
        })]);
      case "olhosContorno":
        return rec("Contorno", stamp("XT · Contorno olhos").concat([highPass(scale(i, 1.5, 3.5)), blend("overlay"), opacity(scale(i, 18, 40))]));
      case "batom":
      case "volumeBatom":
        return rec(ATOM[key].label, [vibranceAdj(i)]);
      case "grao":
        return rec("Grão", stamp("XT · Grão").concat([
          D({
            _obj: "addNoise",
            amount: { _unit: "percentUnit", _value: scale(i, 2, 7) },
            distribution: { _enum: "distribution", _value: "gaussian" },
            monochromatic: true
          }),
          blend("overlay"),
          opacity(scale(i, 18, 42))
        ]));
      case "desfoque":
        return rec("Desfoque", [subject(), inverse()].concat(stamp("XT · Desfoque"), [gauss(scale(i, 6, 22)), opacity(scale(i, 40, 80)), deselect()]));
      case "destaque":
        return rec("Destaque", [subject()].concat(stamp("XT · Destaque"), [
          D({
            _obj: "brightnessEvent",
            brightness: rnd(scale(i, 4, 14)),
            contrast: rnd(scale(i, 2, 10)),
            useLegacy: false
          }),
          deselect()
        ]));
      default:
        return rec(ATOM[key] ? ATOM[key].label : key, stamp(ATOM[key] ? ATOM[key].group : "XT · Look").concat([acr(i)]));
    }
  }

  function needDoc() {
    if (!app.documents.length) throw new Error("Abra um documento.");
  }

  async function play(title, descriptors) {
    needDoc();
    await core.executeAsModal(async function () {
      for (var n = 0; n < descriptors.length; n++) {
        try {
          var d = descriptors[n];
          if (!d._options) d._options = { dialogOptions: "dontDisplay" };
          await action.batchPlay([d], {});
        } catch (e) {}
      }
    }, { commandName: title });
  }

  async function exportDoc(kind) {
    needDoc();
    const fs = uxp.storage.localFileSystem;
    const isPng = kind === "png";
    const file = await fs.getFileForSaving(isPng ? "xtreme.png" : "xtreme.jpg", { types: [isPng ? "png" : "jpg"] });
    if (!file) return;
    await core.executeAsModal(async function () {
      if (isPng) await app.activeDocument.saveAs.png(file);
      else await app.activeDocument.saveAs.jpg(file, { quality: kind === "web" ? 8 : 12 }, true);
    }, { commandName: "Xtreme · Salvar" });
  }

  async function runAtom(key) {
    const def = ATOM[key];
    try {
      if (def.exportKind) {
        if (def.exportKind === "save") {
          needDoc();
          await core.executeAsModal(async function () { await app.activeDocument.save(); }, { commandName: "Xtreme · Salvar" });
        } else {
          await exportDoc(def.exportKind);
        }
        setStatus(def.label);
        return;
      }
      const recp = recipe(key, state.intensity);
      setStatus("Aplicando " + recp.title + "…");
      await play("Xtreme · " + recp.title, recp.descriptors);
      setStatus(def.group + " · " + state.intensity + "%");
    } catch (err) {
      setStatus(err.message || String(err), true);
    }
  }

  async function runStack(label, stack) {
    try {
      needDoc();
      setStatus(label + "…");
      await core.executeAsModal(async function (ctx) {
        const token = await ctx.hostControl.suspendHistory({
          documentID: app.activeDocument.id,
          name: "Xtreme · " + label
        });
        try {
          for (let n = 0; n < stack.length; n++) {
            const key = stack[n][0];
            const intensity = stack[n][1];
            if (ATOM[key] && ATOM[key].exportKind) continue;
            const recp = recipe(key, intensity);
            await action.batchPlay(recp.descriptors, { synchronousExecution: false, modalBehavior: "execute" });
          }
        } finally {
          await ctx.hostControl.resumeHistory(token);
        }
      }, { commandName: "Xtreme · " + label });
      setStatus(label + " · um passo");
    } catch (err) {
      setStatus(err.message || String(err), true);
    }
  }


  async function runLook() {
    try {
      needDoc();
      var p = PROFILES[state.profile];
      setStatus("Deixando pronta · " + p.label + "…");
      await core.executeAsModal(async function (ctx) {
        var token = await ctx.hostControl.suspendHistory({
          documentID: app.activeDocument.id,
          name: "Xtreme · " + p.label
        });
        try {
          var descriptors = lookDescriptors(state.profile, state.intensity);
          for (var n = 0; n < descriptors.length; n++) {
            try {
              var d = descriptors[n];
              if (!d._options) d._options = { dialogOptions: "dontDisplay" };
              await action.batchPlay([d], {});
            } catch (e) {}
          }
        } finally {
          await ctx.hostControl.resumeHistory(token);
        }
      }, { commandName: "Xtreme · " + p.label });
      setStatus(p.label + " · foto pronta · um undo");
    } catch (err) {
      setStatus(err.message || String(err), true);
    }
  }

  function loteCount() {
    var n = 0;
    document.querySelectorAll("[data-lote]").forEach(function (cb) {
      if (cb.checked) n += 1;
    });
    return n;
  }

  function refreshLote() {
    var el = document.getElementById("runBatch");
    if (el) el.textContent = "Lote (" + loteCount() + ")";
  }

  function bind() {
    document.querySelectorAll("[data-profile]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.profile = chip.getAttribute("data-profile");
        document.querySelectorAll("[data-profile]").forEach(function (c) {
          c.className = c.getAttribute("data-profile") === state.profile ? "chip active" : "chip";
        });
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
      btn.addEventListener("click", function () {
        runAtom(btn.getAttribute("data-recipe"));
      });
    });

    document.querySelectorAll("[data-lote]").forEach(function (cb) {
      cb.addEventListener("change", refreshLote);
    });

    document.querySelectorAll("[data-lote-sec]").forEach(function (tog) {
      tog.addEventListener("click", function () {
        var boxes = [];
        var node = tog.parentElement.nextElementSibling;
        while (node && node.className === "tool") {
          var input = node.querySelector("[data-lote]");
          if (input) boxes.push(input);
          node = node.nextElementSibling;
        }
        var allOn = boxes.length && boxes.every(function (b) { return b.checked; });
        boxes.forEach(function (b) { b.checked = !allOn; });
        tog.textContent = !allOn ? "Lote off" : "Lote seção";
        refreshLote();
      });
    });

    document.getElementById("applyProfile").addEventListener("click", function () {
      runLook();
    });

    document.getElementById("runBatch").addEventListener("click", function () {
      runLook();
    });

    refreshLote();
    setStatus("Pronto · um clique deixa a foto pronta");
  }

  try {
    bind();
  } catch (err) {
    setStatus("Falha ao ligar UI: " + err.message, true);
  }
})();
