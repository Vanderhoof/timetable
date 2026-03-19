import { useStore } from '../store';
import { shortTeacherName } from '../logic/groupNames';
import { useToast } from '../hooks/useToast';
import type { CurriculumPlan } from '../types';
import styles from './HomeroomPage.module.css';

interface Props {
  plan: CurriculumPlan | null;
}

export function HomeroomPage({ plan }: Props) {
  const { teachers, homeroomAssignments, setHomeroom, removeHomeroom } = useStore();
  const { notify } = useToast();

  if (!plan) {
    return (
      <div>
        <h2>Классные руководители</h2>
        <p style={{ color: '#888' }}>Сначала загрузите учебный план (вкладка 1)</p>
      </div>
    );
  }

  function getTeacherId(className: string): string {
    return homeroomAssignments.find((h) => h.className === className)?.teacherId ?? '';
  }

  function handleChange(className: string, teacherId: string) {
    if (teacherId) {
      setHomeroom(className, teacherId);
      const t = teachers.find((t) => t.id === teacherId);
      if (t) notify(`Классный руководитель назначен: ${shortTeacherName(t.name)} — ${className}`, 'success');
    } else {
      removeHomeroom(className);
    }
  }

  const assigned = plan.classNames.filter((cn) => getTeacherId(cn));
  const unassigned = plan.classNames.filter((cn) => !getTeacherId(cn));

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Классные руководители</h2>
      <p className={styles.note}>
        Каждому классу автоматически добавляется «Разговоры о важном» (1 ч/нед) —
        ведёт классный руководитель.
      </p>

      <div className={styles.progress}>
        <div
          className={styles.progressBar}
          style={{ width: `${(assigned.length / plan.classNames.length) * 100}%` }}
        />
      </div>
      <p className={styles.progressText}>
        Назначено: {assigned.length} / {plan.classNames.length}
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Класс</th>
            <th>Классный руководитель</th>
            <th>Разговоры о важном</th>
          </tr>
        </thead>
        <tbody>
          {plan.classNames.map((cn) => {
            const tid = getTeacherId(cn);
            const teacher = teachers.find((t) => t.id === tid);
            return (
              <tr key={cn}>
                <td className={styles.className}>{cn}</td>
                <td>
                  <select
                    className={`${styles.select} ${!tid ? styles.selectEmpty : ''}`}
                    value={tid}
                    onChange={(e) => handleChange(cn, e.target.value)}
                  >
                    <option value="">— не назначен —</option>
                    {[...teachers].sort((a, b) => a.name.localeCompare(b.name, 'ru')).map((t) => (
                      <option key={t.id} value={t.id}>{shortTeacherName(t.name)}</option>
                    ))}
                  </select>
                </td>
                <td className={styles.razgovory}>
                  {teacher ? (
                    <span className={styles.razgovoryOk} title={teacher.name}>1 ч — {shortTeacherName(teacher.name)}</span>
                  ) : (
                    <span className={styles.razgovoryMissing}>не назначен</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {unassigned.length > 0 && (
        <p className={styles.warning}>
          Не назначены классные руководители для: {unassigned.join(', ')}
        </p>
      )}
    </div>
  );
}
