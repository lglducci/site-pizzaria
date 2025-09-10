 // components/CartItem.js
import React, { useMemo } from "react";

// helpers visuais
const fmt = (n) => Number(n ?? 0).toFixed(2);
const cap = (s) =>
  s ? s.toString().charAt(0).toUpperCase() + s.toString().slice(1).toLowerCase() : "";

// extrai (G|M|P) do fim do nome
const extractSizeFromName = (name) => {
  const m = String(name || "").match(/\((G|M|P)\)\s*$/i);
  if (!m) return "";
  const ch = m[1].toUpperCase();
  return ch === "G" ? "Grande" : ch === "M" ? "Média" : "Pequena";
};

// extrai volume (2L, 2.5L, 600 ml…)
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
  const { item } = props;
  const inc = props.onInc || props.onAdd || props.inc;
  const dec = props.onDec || props.onMinus || props.dec;

  const categoria = (item?.categoria || item?.category || "").toString().toLowerCase();

  const sizeOrVolume = useMemo(() => {
    if (!categoria) return "";
    if (categoria.includes("pizza")) {
      const raw = (item?.size ?? item?.tamanho ?? "").toString().trim();
      return raw || extractSizeFromName(item?.name || item?.nome);
    }
    if (categoria.includes("bebida")) {
      const raw = (item?.volume ?? "").toString().trim();
      return raw || extractVolumeFromName(item?.name || item?.nome);
    }
    return "";
  }, [categoria, item]);

  const price = Number(item?.price ?? item?.preco ?? 0);
  const qtd = Number(item?.qtd ?? 1);

  return (
    <div className="ci-row">
      <div className="ci-left">
        <div className="ci-title">{item?.name || item?.nome}</div>

        <div className="ci-meta">
          {!!categoria && <span className="pill">{cap(categoria)}</span>}
          {!!sizeOrVolume && <span className="ci-size">({sizeOrVolume})</span>}
        </div>

        <div className="ci-price">R$ {fmt(price)}</div>
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
          font-size: 14px;        /* menor */
          font-weight: 600;       /* sem strong */
          color: #111827;
          line-height: 1.25;
          margin: 0 0 4px;
          word-break: break-word;
        }
        .ci-meta {
          display: flex;
          align-items: center;
          gap: 8px;               /* espaçamento uniforme */
          margin: 0 0 6px;
          flex-wrap: wrap;
        }
        .pill {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 9999px;
          background: #f3f4f6;    /* MESMA cor para todos */
          color: #111827;
          border: 1px solid #e5e7eb;
        }
        .ci-size {
          font-size: 12px;
          color: #6b7280;         /* discreto, entre parênteses */
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
