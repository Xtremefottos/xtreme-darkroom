(function () {
  const statusEl = document.getElementById("status");
  const appRoot = document.getElementById("app");

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
  function GROUP(name) {
    return { _obj: "make", _target: [{ _ref: "layerSection" }], using: { _obj: "layerSection", name: name } };
  }
  function DUPLICATE(name) {
    return { _obj: "duplicate", _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }], name: name };
  }
  function setBlend(mode) {
    return { _obj: "set", _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }], to: { _obj: "layer", mode: { _enum: "blendMode", _value: mode } } };
  }
  function setOpacity(pct) {
    return { _obj: "set", _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }], to: { _obj: "layer", opacity: { _unit: "percentUnit", _value: pct } } };
  }
  function gaussianBlur(radius) {
    return { _obj: "gaussianBlur", radius: { _unit: "pixelsUnit", _value: radius } };
  }
  function highPass(radius) {
    return { _obj: "highPass", radius: { _unit: "pixelsUnit", _value: radius } };
  }
  function solidFill(r, g, b, name) {
    return {
      _obj: "make",
      _target: [{ _ref: "contentLayer" }],
      using: {
        _obj: "contentLayer",
        type: { _obj: "solidColorLayer", color: { _obj: "RGBColor", red: r, grain: g, blue: b } },
        name: name
      }
    };
  }

  function rec(title, descriptors) { return { title: title, descriptors: descriptors }; }

  function basic(group, i, blend, opMin, opMax) {
    return rec(group.replace("XT · ", ""), [
      GROUP(group),
      DUPLICATE(group + " · base"),
      setBlend(blend),
      setOpacity(scale(i, opMin, opMax))
    ]);
  }

  function gray(group, i, r, g, b, blend) {
    return rec(group.replace("XT · ", ""), [
      GROUP(group),
      solidFill(r, g, b, group + " · fill"),
      setBlend(blend),
      setOpacity(scale(i, 18, 62))
    ]);
  }

  function recipe(key, i) {
    switch (key) {
      case "skinHeal":
      case "pelePerfeita":
      case "peleDoBruxo":
      case "remManchas":
      case "mesclagem":
      case "remCabeloRosto":
        return rec(ATOM[key].label, [GROUP(ATOM[key].group), DUPLICATE(ATOM[key].group + " · heal"), gaussianBlur(scale(i, 1.4, 6)), setOpacity(scale(i, 28, 80))]);
      case "freqSep":
      case "texturaPele":
      case "extratorDetalhes":
        return rec(ATOM[key].label, [GROUP(ATOM[key].group), DUPLICATE(ATOM[key].group + " · cor"), gaussianBlur(scale(i, 3, 12)), DUPLICATE(ATOM[key].group + " · textura"), highPass(scale(i, 1.2, 4)), setBlend("linearLight"), setOpacity(scale(i, 35, 80))]);
      case "dodgeBurn":
        return rec("D&B", [GROUP("XT · D&B"), solidFill(128, 128, 128, "XT · Dodge"), setBlend("softLight"), setOpacity(scale(i, 20, 70)), solidFill(128, 128, 128, "XT · Burn"), setBlend("softLight"), setOpacity(scale(i, 20, 70))]);
      case "dodge":
      case "dbOlhos":
        return gray(ATOM[key].group, i, 160, 160, 160, "softLight");
      case "burn":
      case "olhosContorno":
      case "escurecer":
      case "contrasteFundo":
        return gray(ATOM[key].group, i, 40, 36, 32, "multiply");
      case "eyes":
      case "olhosMagicos":
        return rec(ATOM[key].label, [GROUP(ATOM[key].group), DUPLICATE(ATOM[key].group + " · íris"), setBlend("softLight"), setOpacity(scale(i, 15, 55)), DUPLICATE(ATOM[key].group + " · catch"), setBlend("screen"), setOpacity(scale(i, 8, 28))]);
      case "teeth":
      case "dentesBrancos":
        return basic(ATOM[key].group, i, "luminosity", 10, 45);
      case "grade":
      case "contrasteFinal":
      case "solarCurve":
      case "dbCurvas":
        return basic(ATOM[key].group, i, "softLight", 8, 40);
      case "glamourGlow":
        return rec("Glow", [GROUP("XT · Glow"), DUPLICATE("XT · Glow · orton"), gaussianBlur(scale(i, 6, 18)), setBlend("screen"), setOpacity(scale(i, 12, 40))]);
      case "tomPele":
      case "corIndireta":
        return gray(ATOM[key].group, i, 180, 140, 110, "softLight");
      case "copiarCores":
        return basic("XT · Copiar cores", i, "color", 12, 40);
      case "limparFundo":
        return gray("XT · Fundo limpo", i, 18, 16, 14, "multiply");
      case "limparFundoExterna":
        return rec("Fundo externa", [
          GROUP("XT · Fundo externa"),
          { _obj: "selectSubject", sampleAllLayers: false },
          { _obj: "inverse" },
          DUPLICATE("XT · Bokeh"),
          gaussianBlur(scale(i, 8, 28)),
          setOpacity(scale(i, 45, 90)),
          { _obj: "set", _target: [{ _ref: "channel", _property: "selection" }], to: { _enum: "ordinal", _value: "none" } }
        ]);
      case "colorirFundo":
        return gray("XT · Fundo cor", i, 92, 64, 48, "color");
      case "checkLayer":
        return rec("Check", [GROUP("XT · Check"), DUPLICATE("XT · Check · pb"), { _obj: "blackAndWhite" }, setOpacity(scale(i, 40, 100))]);
      case "olhosTrocarCor":
      case "batomTrocarCor":
        return gray(ATOM[key].group, i, 70, 90, 140, "color");
      case "olhosNitidez":
      case "nitidez12":
      case "superNitidez":
        return rec(ATOM[key].label, [GROUP(ATOM[key].group), DUPLICATE(ATOM[key].group + " · hp"), highPass(scale(i, 0.8, 2.4)), setBlend("overlay"), setOpacity(scale(i, 14, 42))]);
      case "batom":
      case "volumeBatom":
        return gray(ATOM[key].group, i, 120, 28, 32, "multiply");
      case "grao":
        return rec("Grão", [GROUP("XT · Grão"), DUPLICATE("XT · Grão · noise"), { _obj: "addNoise", amount: { _unit: "percentUnit", _value: scale(i, 2, 8) }, distribution: { _enum: "distribution", _value: "gaussian" }, monochromatic: true }, setBlend("overlay"), setOpacity(scale(i, 12, 45))]);
      case "desfoque":
        return rec("Desfoque", [GROUP("XT · Desfoque"), DUPLICATE("XT · Desfoque · blur"), gaussianBlur(scale(i, 4, 16)), setOpacity(scale(i, 20, 50))]);
      case "destaque":
        return basic("XT · Destaque", i, "softLight", 16, 40);
      case "luzBaixa":
        return gray("XT · Luz baixa", i, 20, 18, 16, "multiply");
      default:
        return rec(ATOM[key] ? ATOM[key].label : key, [GROUP(ATOM[key] ? ATOM[key].group : "XT · " + key), DUPLICATE("XT · base"), setOpacity(scale(i, 20, 60))]);
    }
  }

  function needDoc() {
    if (!app.documents.length) throw new Error("Abra um documento.");
  }

  async function play(title, descriptors) {
    needDoc();
    await core.executeAsModal(async function () {
      await action.batchPlay(descriptors, { synchronousExecution: false, modalBehavior: "execute" });
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

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function loteN() {
    return Object.keys(state.batch).filter(function (k) { return state.batch[k]; }).length;
  }

  function mount() {
    while (appRoot.firstChild) appRoot.removeChild(appRoot.firstChild);

    const profiles = el("section", "block");
    profiles.appendChild(el("span", "lbl", "Perfil de sessão"));
    const prow = el("div", "row");
    Object.keys(PROFILES).forEach(function (id) {
      const b = el("div", "chip" + (id === state.profile ? " active" : ""), PROFILES[id].label);
      b.setAttribute("role", "button");
      b.addEventListener("click", function () {
        state.profile = id;
        mount();
      });
      prow.appendChild(b);
    });
    profiles.appendChild(prow);
    appRoot.appendChild(profiles);

    const intens = el("section", "block");
    const ir = el("div", "row between");
    ir.appendChild(el("span", "lbl", "Intensidade"));
    const ival = el("span", "val", String(state.intensity));
    ir.appendChild(ival);
    intens.appendChild(ir);
    const range = document.createElement("input");
    range.type = "range";
    range.min = "0";
    range.max = "100";
    range.value = String(state.intensity);
    range.addEventListener("input", function (e) {
      state.intensity = Number(e.target.value);
      ival.textContent = String(state.intensity);
    });
    intens.appendChild(range);
    appRoot.appendChild(intens);

    const actions = el("section", "block");
    const apply = el("div", "primary", "Aplicar perfil inteiro");
    apply.setAttribute("role", "button");
    apply.addEventListener("click", function () {
      const p = PROFILES[state.profile];
      runStack(p.label, p.stack);
    });
    actions.appendChild(apply);
    const row2 = el("div", "row");
    row2.style.marginTop = "6px";
    const lote = el("div", "ghost", "Lote (" + loteN() + ")");
    lote.setAttribute("role", "button");
    lote.addEventListener("click", function () {
      const stack = ATOMS.filter(function (a) { return state.batch[a.key] && !a.exportKind; }).map(function (a) {
        return [a.key, state.intensity];
      });
      if (!stack.length) {
        setStatus("Marque funções no lote", true);
        return;
      }
      runStack("Lote", stack);
    });
    row2.appendChild(lote);
    actions.appendChild(row2);
    actions.appendChild(el("p", "hint", "Checkbox = lote. Aplicar = foto atual. Um undo por ação."));
    appRoot.appendChild(actions);

    SECTIONS.forEach(function (sec) {
      const head = el("div", "sec-head");
      head.appendChild(el("span", "lbl", sec.label));
      const allOn = sec.keys.every(function (k) { return state.batch[k]; });
      const tog = el("div", "link", allOn ? "Lote off" : "Lote seção");
      tog.addEventListener("click", function () {
        sec.keys.forEach(function (k) { state.batch[k] = !allOn; });
        mount();
      });
      head.appendChild(tog);
      appRoot.appendChild(head);

      sec.keys.forEach(function (key) {
        const a = ATOM[key];
        const row = el("div", "tool");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "check";
        cb.checked = !!state.batch[key];
        cb.addEventListener("change", function () {
          state.batch[key] = cb.checked;
          mount();
        });
        row.appendChild(cb);
        row.appendChild(el("span", "name", a.label));
        const btn = el("div", "xt-btn apply", "Aplicar");
        btn.setAttribute("role", "button");
        btn.addEventListener("click", function () { runAtom(key); });
        row.appendChild(btn);
        appRoot.appendChild(row);
      });
    });

    setStatus("Pronto · " + ATOMS.length + " funções");
  }

  try {
    mount();
  } catch (err) {
    setStatus("Falha ao montar UI: " + err.message, true);
  }
})();
