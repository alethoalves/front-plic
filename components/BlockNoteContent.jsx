import styles from "./BlockNoteContent.module.scss";

// Cores nomeadas do BlockNote (paleta própria do editor, independente do tema
// do projeto — reproduz exatamente a cor que o autor escolheu no editor).
const TEXT_COLORS = {
  gray: "#9b9a97",
  brown: "#64473a",
  red: "#e03e3e",
  orange: "#d9730d",
  yellow: "#dfab01",
  green: "#4d6461",
  blue: "#0b6e99",
  purple: "#6940a5",
  pink: "#ad1a72",
};

const BACKGROUND_COLORS = {
  gray: "#ebeced",
  brown: "#e9e5e3",
  red: "#fbe4e4",
  orange: "#f6e9d9",
  yellow: "#fbf3db",
  green: "#ddedea",
  blue: "#ddebf1",
  purple: "#eae4f2",
  pink: "#f4dfeb",
};

const FILE_BLOCK_LABELS = {
  image: "Imagem sem conteúdo",
  video: "Vídeo sem conteúdo",
  audio: "Áudio sem conteúdo",
  file: "Arquivo sem conteúdo",
};

const colorStyle = (props = {}) => {
  const style = {};
  if (props.textColor && props.textColor !== "default") {
    style.color = TEXT_COLORS[props.textColor] || props.textColor;
  }
  if (props.backgroundColor && props.backgroundColor !== "default") {
    style.backgroundColor =
      BACKGROUND_COLORS[props.backgroundColor] || props.backgroundColor;
  }
  return style;
};

const blockStyle = (props = {}) => {
  const style = colorStyle(props);
  if (props.textAlignment && props.textAlignment !== "left") {
    style.textAlign = props.textAlignment;
  }
  return style;
};

const styleOrUndefined = (style) => (Object.keys(style).length ? style : undefined);

const renderInline = (content, key) => {
  if (!Array.isArray(content)) return null;
  return content.map((item, i) => {
    if (item.type === "link") {
      return (
        <a
          key={`${key}-${i}`}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.bnLink}
        >
          {renderInline(item.content, `${key}-${i}`)}
        </a>
      );
    }

    const text = item.text ?? "";
    const s = item.styles ?? {};
    let node = <>{text}</>;
    if (s.bold) node = <strong>{node}</strong>;
    if (s.italic) node = <em>{node}</em>;
    if (s.underline) node = <u>{node}</u>;
    if (s.strike) node = <s>{node}</s>;
    if (s.code) node = <code className={styles.inlineCode}>{node}</code>;
    return (
      <span key={`${key}-${i}`} style={styleOrUndefined(colorStyle(s))}>
        {node}
      </span>
    );
  });
};

// Group a children array, wrapping consecutive list items in <ol>/<ul>
const renderChildren = (childBlocks, parentKey) => {
  if (!childBlocks?.length) return null;
  const elements = [];
  let ci = 0;
  while (ci < childBlocks.length) {
    const c = childBlocks[ci];
    if (c.type === "bulletListItem") {
      const items = [];
      while (ci < childBlocks.length && childBlocks[ci].type === "bulletListItem") {
        items.push(renderBlock(childBlocks[ci], `${parentKey}-${ci}`));
        ci++;
      }
      elements.push(
        <ul key={`ul-${parentKey}-${ci}`} className={styles.bnList}>
          {items}
        </ul>
      );
    } else if (c.type === "numberedListItem") {
      const items = [];
      while (ci < childBlocks.length && childBlocks[ci].type === "numberedListItem") {
        items.push(renderBlock(childBlocks[ci], `${parentKey}-${ci}`));
        ci++;
      }
      elements.push(
        <ol key={`ol-${parentKey}-${ci}`} className={styles.bnList}>
          {items}
        </ol>
      );
    } else {
      elements.push(renderBlock(c, `${parentKey}-${ci}`));
      ci++;
    }
  }
  return elements;
};

const renderTable = (block, i) => {
  const content = block.content;
  if (!content || content.type !== "tableContent" || !Array.isArray(content.rows)) {
    return null;
  }
  return (
    <div key={i} className={styles.bnTableWrap}>
      <table className={styles.bnTable}>
        <tbody>
          {content.rows.map((row, ri) => (
            <tr key={ri}>
              {row.cells.map((cell, ci) => {
                const isCellObject = cell && !Array.isArray(cell) && cell.type === "tableCell";
                const cellContent = isCellObject ? cell.content : cell;
                const cellProps = isCellObject ? cell.props ?? {} : {};
                const isHeader =
                  (content.headerRows && ri < content.headerRows) ||
                  (content.headerCols && ci < content.headerCols);
                const Tag = isHeader ? "th" : "td";
                return (
                  <Tag
                    key={ci}
                    colSpan={cellProps.colspan}
                    rowSpan={cellProps.rowspan}
                    style={styleOrUndefined(blockStyle(cellProps))}
                  >
                    {renderInline(cellContent, `bn-${i}-${ri}-${ci}`)}
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderFileBlock = (block, i) => {
  const props = block.props ?? {};
  const { url, caption, name } = props;

  if (!url) {
    return (
      <p key={i} className={styles.bnEmpty}>
        {FILE_BLOCK_LABELS[block.type] || "Conteúdo sem preenchimento"}
      </p>
    );
  }

  const fileName = name || url.split("/").pop();
  let media;
  if (block.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    media = <img src={url} alt={caption || fileName} className={styles.bnMedia} />;
  } else if (block.type === "video") {
    media = <video src={url} controls className={styles.bnMedia} />;
  } else if (block.type === "audio") {
    media = <audio src={url} controls className={styles.bnAudio} />;
  } else {
    media = (
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.bnFileLink}>
        📎 {fileName}
      </a>
    );
  }

  return (
    <div key={i} className={styles.bnFileBlock}>
      {media}
      {caption && <p className={styles.bnCaption}>{caption}</p>}
    </div>
  );
};

const renderBlock = (block, i) => {
  const inline = renderInline(block.content, `bn-${i}`);
  const style = styleOrUndefined(blockStyle(block.props));

  switch (block.type) {
    case "heading": {
      const level = block.props?.level ?? 1;
      const Tag = level === 1 ? "h4" : level === 2 ? "h5" : "h6";
      return (
        <Tag key={i} className={styles.bnHeading} style={style}>
          {inline}
        </Tag>
      );
    }
    case "bulletListItem": {
      const childElements = renderChildren(block.children, i);
      return (
        <li key={i} className={styles.bnItem} style={style}>
          {inline}
          {childElements && <div className={styles.bnChildrenWrap}>{childElements}</div>}
        </li>
      );
    }
    case "numberedListItem": {
      const childElements = renderChildren(block.children, i);
      return (
        <li key={i} className={styles.bnItem} style={style}>
          {inline}
          {childElements && <div className={styles.bnChildrenWrap}>{childElements}</div>}
        </li>
      );
    }
    case "checkListItem": {
      const childElements = renderChildren(block.children, i);
      const checked = block.props?.checked;
      return (
        <li key={i} className={styles.bnCheckItem} style={style}>
          <span className={checked ? styles.bnChecked : styles.bnUnchecked}>
            {checked ? "☑" : "☐"}
          </span>
          <span className={checked ? styles.bnCheckedText : undefined}>{inline}</span>
          {childElements && <div className={styles.bnChildrenWrap}>{childElements}</div>}
        </li>
      );
    }
    case "quote": {
      const childElements = renderChildren(block.children, i);
      return (
        <blockquote key={i} className={styles.bnQuote} style={style}>
          {inline || <br />}
          {childElements && <div className={styles.bnChildrenWrap}>{childElements}</div>}
        </blockquote>
      );
    }
    case "codeBlock": {
      return (
        <pre key={i} className={styles.bnCodeBlock}>
          <code>{inline}</code>
        </pre>
      );
    }
    case "table":
      return renderTable(block, i);
    case "image":
    case "video":
    case "audio":
    case "file":
      return renderFileBlock(block, i);
    case "pageBreak":
      return <hr key={i} className={styles.bnPageBreak} />;
    default: {
      const childElements = renderChildren(block.children, i);
      if (childElements) {
        return (
          <div key={i}>
            <p className={styles.bnParagraph} style={style}>{inline || <br />}</p>
            <div className={styles.bnChildrenWrap}>{childElements}</div>
          </div>
        );
      }
      return (
        <p key={i} className={styles.bnParagraph} style={style}>
          {inline || <br />}
        </p>
      );
    }
  }
};

const BlockNoteContent = ({ value }) => {
  if (!value) return null;
  try {
    const blocks = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(blocks) || !blocks.length) return null;

    const elements = [];
    let i = 0;
    while (i < blocks.length) {
      const b = blocks[i];
      if (b.type === "bulletListItem") {
        const items = [];
        while (i < blocks.length && blocks[i].type === "bulletListItem") {
          items.push(renderBlock(blocks[i], i));
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className={styles.bnList}>
            {items}
          </ul>
        );
      } else if (b.type === "numberedListItem") {
        const items = [];
        while (i < blocks.length && blocks[i].type === "numberedListItem") {
          items.push(renderBlock(blocks[i], i));
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className={styles.bnList}>
            {items}
          </ol>
        );
      } else {
        elements.push(renderBlock(b, i));
        i++;
      }
    }
    return <div className={styles.blockNoteContent}>{elements}</div>;
  } catch {
    return <p className={styles.bnParagraph}>{String(value)}</p>;
  }
};

export default BlockNoteContent;
