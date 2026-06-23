import styles from "./BlockNoteContent.module.scss";

const renderInline = (content, key) => {
  if (!Array.isArray(content)) return null;
  return content.map((item, i) => {
    const text = item.text ?? "";
    const s = item.styles ?? {};
    let node = <>{text}</>;
    if (s.bold) node = <strong>{node}</strong>;
    if (s.italic) node = <em>{node}</em>;
    if (s.underline) node = <u>{node}</u>;
    if (s.strikethrough) node = <s>{node}</s>;
    if (s.code) node = <code className={styles.inlineCode}>{node}</code>;
    return <span key={`${key}-${i}`}>{node}</span>;
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

const renderBlock = (block, i) => {
  const inline = renderInline(block.content, `bn-${i}`);

  switch (block.type) {
    case "heading": {
      const level = block.props?.level ?? 1;
      const Tag = level === 1 ? "h4" : level === 2 ? "h5" : "h6";
      return (
        <Tag key={i} className={styles.bnHeading}>
          {inline}
        </Tag>
      );
    }
    case "bulletListItem": {
      const childElements = renderChildren(block.children, i);
      return (
        <li key={i} className={styles.bnItem}>
          {inline}
          {childElements && <div className={styles.bnChildrenWrap}>{childElements}</div>}
        </li>
      );
    }
    case "numberedListItem": {
      const childElements = renderChildren(block.children, i);
      return (
        <li key={i} className={styles.bnItem}>
          {inline}
          {childElements && <div className={styles.bnChildrenWrap}>{childElements}</div>}
        </li>
      );
    }
    case "checkListItem": {
      const childElements = renderChildren(block.children, i);
      return (
        <li key={i} className={styles.bnCheckItem}>
          <span className={block.props?.checked ? styles.bnChecked : styles.bnUnchecked}>
            {block.props?.checked ? "☑" : "☐"}
          </span>
          {inline}
          {childElements && <div className={styles.bnChildrenWrap}>{childElements}</div>}
        </li>
      );
    }
    default: {
      const childElements = renderChildren(block.children, i);
      if (childElements) {
        return (
          <div key={i}>
            <p className={styles.bnParagraph}>{inline || <br />}</p>
            <div className={styles.bnChildrenWrap}>{childElements}</div>
          </div>
        );
      }
      return (
        <p key={i} className={styles.bnParagraph}>
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
