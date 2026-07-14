class UnionbayQuickShopTrigger extends PopupBase {
  constructor() {
    super();
    this.url = this.dataset.url;
    this.addEventListener("click", this.onClick.bind(this));
    this.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.onClick(event);
      }
    });
  }

  onClick(event) {
    event.preventDefault();
    if (this.classList.contains("loading")) return;

    this.classList.add("loading");
    fetch(this.url)
      .then((response) => response.text())
      .then((text) => {
        const doc = parser.parseFromString(text, "text/html");
        const content =
          doc.querySelector("#shopify-section-unionbay-quick-shop .unionbay-quick-shop__content") ||
          doc.querySelector(".unionbay-quick-shop__content");
        if (!content) return;

        this.loadScripts(content);
        content.classList.remove("hidden");
        this.initPopup(content);
        this.initUnionbayQuickShop(content);
      })
      .finally(() => {
        if (typeof Shopify !== "undefined" && Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }
        if (typeof BlsLazyloadImg !== "undefined") {
          BlsLazyloadImg.init();
        }
        this.classList.remove("loading");
      })
      .catch((error) => {
        this.classList.remove("loading");
        console.error(error);
      });
  }

  loadScripts(html) {
    html.querySelectorAll("script").forEach((script) => {
      if (!script.src && !script.textContent.trim()) return;
      const newScript = document.createElement("script");
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      document.body.appendChild(newScript).parentNode.removeChild(newScript);
    });
  }

  initUnionbayQuickShop(content) {
    const modal = this.modal?.modalBox;
    if (!modal) return;

    const updateAddLabel = () => {
      const variantInput = content.querySelector(".product-variant-id");
      const label = content.querySelector(".unionbay-quick-shop__add-label");
      const lowStock = content.querySelector("[data-unionbay-low-stock]");
      if (!variantInput || !label) return;

      const variantsScript = content.querySelector(".productVariantsQty");
      if (!variantsScript) return;

      try {
        const variants = JSON.parse(variantsScript.textContent);
        const current = variants.find(
          (variant) => String(variant.id) === String(variantInput.value)
        );
        if (!current) return;

        if (current.available === false) {
          label.textContent = label.dataset.soldOut || "Sold out";
          if (lowStock) lowStock.hidden = true;
          return;
        }

        const sizeFieldset = content.querySelector(".product-form__input_size");
        const sizeSelected = sizeFieldset
          ? sizeFieldset.querySelector(".swatch-option.active, input:checked + label.active")
          : true;
        if (sizeFieldset && !sizeSelected) {
          label.textContent = label.dataset.selectSize || "Select size";
        } else {
          label.textContent = label.dataset.addToCart || "Add to cart";
        }

        if (
          lowStock &&
          current.qty > 0 &&
          current.qty <= 3 &&
          current.mamagement !== ""
        ) {
          const template = lowStock.dataset.template || "Only {{ count }} left in this size!";
          lowStock.textContent = template.replace("[[count]]", current.qty).replace(/\{\{\s*count\s*\}\}/g, current.qty);
          lowStock.hidden = false;
        } else if (lowStock) {
          lowStock.hidden = true;
        }
      } catch (error) {
        console.error(error);
      }
    };

    modal.addEventListener("change", updateAddLabel);
    modal.addEventListener("click", (event) => {
      if (event.target.closest(".product__color-swatches--js, .swatch-option")) {
        setTimeout(updateAddLabel, 80);
      }
    });

    setTimeout(updateAddLabel, 200);
  }
}

customElements.define("unionbay-quick-shop-trigger", UnionbayQuickShopTrigger);
