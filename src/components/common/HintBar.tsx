/**
 * HintBar - Single-line muted contextual hint
 */

import styles from './HintBar.module.css';

interface HintBarProps {
  text: string;
}

export function HintBar({ text }: HintBarProps) {
  return <div className={styles.hintBar}>{text}</div>;
}
