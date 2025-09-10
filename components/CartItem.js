 // components/CartItem.js
import React, { useMemo } from "react";

/* num seguro: aceita "53,50", "R$ 53,50", etc. */
const toNum = (x) => {
  if (typeof x === "number" && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const n = Number(s);
  return isFinite(n) ? n : 0;
};
const fmt = (n) => toNum(n).toFixed(2);
const cap = (s) =>
  s ? s.toString().charAt(0).toUpperCase() + s.toString().slice(1).toLowerCase() : "";

/* tamanho no fim do nome: (G|M|P) */
const extractSizeFromName = (name) => {
  const m = String(name || "").match(/\((G|M|P)\)\s*$/i);
  if (!m) return "";
  const ch = m[1].toUpperCase();
  return ch === "G" ? "Grande" : ch === "M" ? "Média" : "Pequena";
};
/* volume tipo 2L / 600 ml */
const extractVolumeFromName = (name) => {
  const s = String(name || "");
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(l|ml)\b/i);
  if (!m) return "";
  const num = m[1].replace(",", ".");
  const unit = m[2].toLowerCase() === "l" ? "L" : "ml";
  const pretty = num.endsWith(".0") ? num.slice(0, -2) : num;
  return `${pretty}${unit === "ml" ? " ml" : "L"}`;
};

export default function CartItem(props) {
  // aceita várias formas que o pai pode mandar
  const item =
    props.item || props.data || props.it || props.product || props.row || {};

  const inc = props.onInc || props.onAdd || props.add || props.inc;
  const dec = props.onDec || props.onMinus || props.minus || props.dec;

  const nome = item?.name ?? item?.nome ?? item?.title ?? "Item";
  const categoriaRaw =
    item?.categoria ?? item?.category ?? item?.tipo ?? item?.grupo ?? "";
  const categoria = categoriaRaw ? String(categoriaRaw).toLowerCase() : "";

  const priceRaw = item?.price ?? item?.preco ?? item?.valor ?? item?.valor_unitario ?? 0;
  const price = toNum(priceRaw);

  const qtd = Number(item?.qtd ?? item?.quantity ?? item?.qty ?? 1);


 
  const sizeOrVolume = useMemo(() => {
    if (!categoria) return "";
    if (categoria.includes("pizza")) {
      const raw = String(item?.size ?? item?.tamanho ?? "").trim();
      return raw || extractSizeFromName(nome);
    }
    if (categoria.includes("bebida")) {
      const raw = String(item?.volume ?? "").trim();
      return raw || extractVolumeFromName(nome);
    }
    return "";
  }, [categoria, item, nome]);

  return (
    <div className="ci-row">
      <div className="ci-left">
        <div className="ci-title">{nome}</div>

        <div className="ci-meta">
          {!!categoria && <span className="pill">{cap(categoria)}</span>}
          {!!sizeOrVolume && <span className="ci-size">({sizeOrVolume})</span>}
        </div>

       
        <div className="ci-price">R$ {fmt(price * qtd)}</div>
      </div>
      <div className="ci-price">
         R$ {fmt(price * qtd)} <span className="ci-unit"> (R$ {fmt(price)} un)</span>
       </div>
   

      <div className="ci-qty">
        <button className="qtb" onClick={() => dec?.(item)} aria-label="Diminuir">
          –
        </button>
        <span className="qtn">{qtd}</span>
        <button className="qtb" onClick={() => inc?.(item)} aria-label="Aumentar">
          +
        </button>
      </div>

      <style jsx>{`
        .ci-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .ci-left {
          min-width: 0;
          margin-right: 12px;
        }
        .ci-title {
          font-size: 14px;      /* menor e legível */
          font-weight: 600;
          color: #111827;
          line-height: 1.25;
          margin: 0 0 4px;
          word-break: break-word;
        }
        .ci-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 6px;
          flex-wrap: wrap;
        }
        .pill {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 9999px;
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
        }
        .ci-size {
          font-size: 12px;
          color: #6b7280;
        }
        .ci-price {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }
        .ci-qty {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .qtb {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          border: 1px solid #cbd5e1;
          background: #fff;
          cursor: pointer;
          line-height: 1;
          font-size: 16px;
        }
        .qtn {
          min-width: 16px;
          text-align: center;
          font-size: 14px;
          color: #111827;
        }
      `}</style>
    </div>
  );
}






