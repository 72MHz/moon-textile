class SizeRecommender extends PopupBase {
  static CHARTS = {
    men_top: { XS: 34, S: 36, M: 40, L: 44, XL: 48, XXL: 52, "3XL": 56 },
    women_top: { XS: 32, S: 34, M: 38, L: 42, XL: 46, XXL: 50 },
    men_bottom: { S: 30, M: 34, L: 38, XL: 42, XXL: 46 },
    women_bottom: { XS: 25, S: 27, M: 29, L: 31, XL: 34, XXL: 36 },
  };

  constructor() {
    super();
    this.popupContent = this.querySelector(".size-recommender__content");
    this.trigger = this.querySelector(".size-recommender__trigger");
    this.submitBtn = this.querySelector("[data-msa-submit]");
    this.resultBox = this.querySelector("[data-msa-result]");
    this.resultSize = this.querySelector("[data-msa-result-size]");
    this.resultNote = this.querySelector("[data-msa-result-note]");
    this.deptSelect = this.querySelector("[data-msa-dept]");
    this.typeSelect = this.querySelector("[data-msa-type]");
    this.chestWrap = this.querySelector("[data-msa-chest-wrap]");
    this.chestLabel = this.querySelector("[data-msa-chest-label]");
    this.waistWrap = this.querySelector("[data-msa-waist-wrap]");
    this.isStandalone = this.dataset.standalone === "true";
    this.availableSizes = [];

    try {
      this.availableSizes = JSON.parse(this.dataset.sizes || "[]");
    } catch (e) {
      this.availableSizes = [];
    }

    this.init();
  }

  getFormRoot() {
    return this.popupContent || this;
  }

  fieldValue(selector) {
    const el = this.getFormRoot().querySelector(selector);
    return el?.value ?? "";
  }

  fieldNumber(selector) {
    const value = Number(this.fieldValue(selector));
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  init() {
    if (!this.popupContent) return;

    if (this.isStandalone && this.closest(".msa-size-recommender-page")) {
      this.popupContent.classList.remove("hidden");
    } else if (this.trigger) {
      this.trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.openModal();
      });
    }

    this.getFormRoot().addEventListener("click", (event) => {
      if (event.target.closest("[data-msa-submit]")) {
        event.preventDefault();
        this.runRecommendation();
      }
    });

    this.deptSelect?.addEventListener("change", () => this.updateFieldLabels());
    this.typeSelect?.addEventListener("change", () => this.updateFieldLabels());
    this.updateFieldLabels();
  }

  openModal() {
    this.popupContent.classList.remove("hidden");
    this.resultBox?.classList.add("hidden");
    this.initPopup(
      this.popupContent,
      `<h3 class="title-popup h5 my-0 px-20 px-md-30 py-20 border-bottom">${this.dataset.textHeader || "Find my size"}</h3>`
    );
  }

  updateFieldLabels() {
    const dept = this.deptSelect?.value || "men";
    const type = this.typeSelect?.value || "top";

    if (this.chestLabel) {
      this.chestLabel.textContent =
        dept === "women" && type === "top"
          ? this.t("bust", "Bust (inches)")
          : this.t("chest", "Chest (inches)");
    }

    if (this.chestWrap) {
      this.chestWrap.style.display = type === "top" ? "" : "none";
    }
    if (this.waistWrap) {
      this.waistWrap.style.display = type === "bottom" ? "" : "none";
    }
  }

  t(key, fallback) {
    const map = window.msaSizeRecommenderStrings || {};
    return map[key] || fallback;
  }

  runRecommendation() {
    const dept = this.fieldValue("[data-msa-dept]") || "men";
    const type = this.fieldValue("[data-msa-type]") || "top";
    const fit = this.fieldValue("[data-msa-fit]") || "regular";
    const height = this.fieldNumber("[data-msa-height]");
    const weight = this.fieldNumber("[data-msa-weight]");
    let chest = this.fieldNumber("[data-msa-chest]");
    let waist = this.fieldNumber("[data-msa-waist]");

    if (type === "top" && !chest && height && weight) {
      chest = this.estimateChest(dept, height, weight);
    }
    if (type === "bottom" && !waist && height && weight) {
      waist = this.estimateWaist(dept, height, weight);
    }

    const measurement = type === "top" ? chest : waist;
    if (!measurement) {
      this.showResult(null, this.t("need_measurements", "Enter your measurements or height and weight."));
      return;
    }

    const chartKey = `${dept}_${type}`;
    const chart = SizeRecommender.CHARTS[chartKey];
    if (!chart) {
      this.showResult(null, this.t("no_match", "We could not match a size. Try our size chart or contact us."));
      return;
    }

    let recommended = this.measureToSize(chart, measurement, fit);

    if (this.availableSizes.length) {
      recommended = this.matchProductSize(recommended, measurement, type);
    }

    if (!recommended) {
      this.showResult(null, this.t("no_match", "We could not match a size. Try our size chart or contact us."));
      return;
    }

    let applied = false;
    if (!this.isStandalone) {
      applied = this.applySize(recommended);
    }

    const note = applied
      ? this.t("applied", "We selected this size for you.")
      : this.isStandalone
        ? this.t("standalone_note", "Use this size when shopping.")
        : this.t("manual_select", "Select this size from the list above.");

    this.showResult(recommended, note);
  }

  estimateChest(dept, height, weight) {
    const bmi = (weight / (height * height)) * 703;
    if (dept === "women") {
      return Math.round(32 + (bmi - 22) * 0.9);
    }
    return Math.round(36 + (bmi - 22) * 1.1);
  }

  estimateWaist(dept, height, weight) {
    const bmi = (weight / (height * height)) * 703;
    if (dept === "women") {
      return Math.round(26 + (bmi - 22) * 0.7);
    }
    return Math.round(30 + (bmi - 22) * 0.8);
  }

  measureToSize(chart, measurement, fit) {
    const entries = Object.entries(chart).sort((a, b) => a[1] - b[1]);
    let match = entries[0]?.[0];

    for (const [size, max] of entries) {
      if (measurement <= max) {
        match = size;
        break;
      }
      match = size;
    }

    const idx = entries.findIndex(([size]) => size === match);
    if (fit === "slim" && idx > 0) {
      return entries[idx - 1][0];
    }
    if (fit === "relaxed" && idx < entries.length - 1) {
      return entries[idx + 1][0];
    }
    return match;
  }

  normalizeToken(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  sizeAliases() {
    return {
      xs: ["xs", "xsmall", "extrasmall"],
      s: ["s", "small", "sm"],
      m: ["m", "medium", "med"],
      l: ["l", "large", "lg"],
      xl: ["xl", "xlarge", "extralarge"],
      xxl: ["xxl", "2xl", "xxlarge"],
      "3xl": ["3xl", "xxxl", "3x"],
    };
  }

  matchProductSize(recommended, measurement, type) {
    const aliases = this.sizeAliases();
    const recToken = this.normalizeToken(recommended);
    let recAliases = [recToken];

    for (const [key, values] of Object.entries(aliases)) {
      if (values.includes(recToken) || key === recToken) {
        recAliases = values.concat([key]);
        break;
      }
    }

    for (const size of this.availableSizes) {
      const token = this.normalizeToken(size);
      if (recAliases.includes(token)) return size;
    }

    if (type === "bottom") {
      const numeric = this.availableSizes
        .map((size) => ({ size, value: parseInt(size, 10) }))
        .filter((item) => !Number.isNaN(item.value))
        .sort((a, b) => Math.abs(a.value - measurement) - Math.abs(b.value - measurement));
      if (numeric.length) return numeric[0].size;
    }

    return this.availableSizes.find((size) => this.normalizeToken(size).includes(recToken)) || recommended;
  }

  applySize(sizeLabel) {
    const sizeOption = this.dataset.sizeOption;
    const sectionId = this.dataset.sectionId;
    const roots = [];

    if (sectionId) {
      const section = document.querySelector(`#shopify-section-${sectionId}`);
      if (section) roots.push(section);
    }

    roots.push(document);

    for (const root of roots) {
      const fieldsets = root.querySelectorAll(".product-form__input_size");
      for (const fieldset of fieldsets) {
        const inputs = sizeOption
          ? fieldset.querySelectorAll(`input[type="radio"][name="${CSS.escape(sizeOption)}"]`)
          : fieldset.querySelectorAll('input[type="radio"]');

        for (const input of inputs) {
          if (input.classList.contains("option-disabled")) continue;
          if (this.sizeValuesMatch(input.value, sizeLabel)) {
            input.checked = true;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.click();
            return true;
          }
        }
      }
    }

    return false;
  }

  sizeValuesMatch(optionValue, recommended) {
    const a = this.normalizeToken(optionValue);
    const b = this.normalizeToken(recommended);
    if (!a || !b) return false;
    if (a === b || a.includes(b) || b.includes(a)) return true;

    const aliases = this.sizeAliases();
    for (const values of Object.values(aliases)) {
      const norm = values.map((v) => this.normalizeToken(v));
      if (norm.includes(a) && norm.includes(b)) return true;
    }
    return false;
  }

  showResult(size, note) {
    if (!this.resultBox || !this.resultSize || !this.resultNote) return;
    this.resultBox.classList.remove("hidden");
    this.resultSize.textContent = size || "—";
    this.resultNote.textContent = note || "";
  }
}

if (!customElements.get("size-recommender")) {
  customElements.define("size-recommender", SizeRecommender);
}
