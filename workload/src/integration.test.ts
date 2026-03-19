/**
 * Integration test: full flow from UP import → assignments → export
 * Verifies the output matches the expected LessonRequirement structure
 * that РШР can import.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { parseUP } from './logic/parseUP';
import { useStore } from './store';
import { generateOutput, detectGroupPairs } from './logic/outputGenerator';
import { validateWorkload } from './logic/validation';
import { deriveInitials } from './logic/groupNames';

// Build a realistic multi-grade UP sheet matching the school's Книга1.xlsx format:
// col[0]=section, col[1]=grade header or subject, col[2+]=hours per class
function makeRealisticUP(): File {
  const rows: (string | number | null)[][] = [
    // Grade 5: classes on same row as header (Case A)
    ['', '5 класс', '5а', '5б', null, null],
    ['Обязательная часть', 'Математика', 5, 5, null, null],
    ['', 'Русский язык', 5, 5, null, null],
    ['', 'Физкультура', 3, 3, null, null],
    ['', '', 13, 13, null, null],          // итого — skipped (empty col[1])
    // Grade 6: classes on separate row (Case B)
    ['', '6 класс', null, null, null, null],
    ['', '', null, null, '6а', null],
    ['', 'Математика', null, null, 5, null],
    ['', 'Русский язык', null, null, 4, null],
    ['Школьная часть', '', null, null, null, null],  // section divider — skipped
    ['', 'Информатика', null, null, 1, null],
    // Grade 10: classes on separate row (Case B)
    ['', '10 класс', null, null, null, null],
    ['', '', null, null, null, '10а'],
    ['', 'Алгебра', null, null, null, 4],
    ['', 'Физкультура', null, null, null, 3],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Учебный план');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new File([buf], 'up.xlsx');
}

beforeEach(() => {
  useStore.getState().resetAll();
});

describe('Full flow: parse UP → assign → generate output', () => {
  it('parses realistic UP correctly', async () => {
    const plan = await parseUP(makeRealisticUP());
    expect(plan.grades.map((g) => g.grade)).toEqual([5, 6, 10]);
    expect(plan.classNames).toEqual(['5-а', '5-б', '6-а', '10-а']);

    const grade5 = plan.grades.find((g) => g.grade === 5)!;
    expect(grade5.subjects.map((s) => s.name)).toContain('Математика');
    expect(grade5.subjects.map((s) => s.name)).toContain('Физкультура');
    expect(grade5.subjects.map((s) => s.name)).not.toContain('Итого');

    const grade6 = plan.grades.find((g) => g.grade === 6)!;
    // Информатика is in Школьная часть — should be parsed normally
    expect(grade6.subjects.map((s) => s.name)).toContain('Информатика');
  });

  it('generates correct class-type requirements from simple assignments', async () => {
    const plan = await parseUP(makeRealisticUP());
    useStore.getState().setCurriculumPlan(plan);

    const { addTeacher, setAssignment } = useStore.getState();
    addTeacher({ id: 't1', name: 'Иванов Пётр Алексеевич', initials: 'П.А.', subjects: ['Математика'] });
    setAssignment({ teacherId: 't1', className: '5а', subject: 'Математика', hoursPerWeek: 5 });
    setAssignment({ teacherId: 't1', className: '5б', subject: 'Математика', hoursPerWeek: 5 });

    const { teachers, assignments, homeroomAssignments } = useStore.getState();
    const output = generateOutput(assignments, teachers, homeroomAssignments);

    expect(output).toHaveLength(2);
    expect(output.every((r) => r.type === 'class')).toBe(true);
    expect(output.every((r) => r.teacher === 'Иванов Пётр Алексеевич')).toBe(true);
    expect(output.find((r) => r.classOrGroup === '5а')?.countPerWeek).toBe(5);
  });

  it('generates group-type requirements when two teachers share class+subject', async () => {
    const plan = await parseUP(makeRealisticUP());
    useStore.getState().setCurriculumPlan(plan);

    const { addTeacher, setAssignment } = useStore.getState();
    addTeacher({ id: 'ta', name: 'Тихомирова Вера Ивановна', initials: deriveInitials('Тихомирова Вера Ивановна'), subjects: ['Физкультура'] });
    addTeacher({ id: 'tb', name: 'Юрова Светлана Петровна', initials: deriveInitials('Юрова Светлана Петровна'), subjects: ['Физкультура'] });
    setAssignment({ teacherId: 'ta', className: '5а', subject: 'Физкультура', hoursPerWeek: 3 });
    setAssignment({ teacherId: 'tb', className: '5а', subject: 'Физкультура', hoursPerWeek: 3 });

    const { teachers, assignments, homeroomAssignments } = useStore.getState();
    const output = generateOutput(assignments, teachers, homeroomAssignments);

    expect(output).toHaveLength(2);
    expect(output.every((r) => r.type === 'group')).toBe(true);

    const grpA = output.find((r) => r.teacher === 'Тихомирова Вера Ивановна')!;
    const grpB = output.find((r) => r.teacher === 'Юрова Светлана Петровна')!;

    expect(grpA.className).toBe('5а');
    expect(grpA.parallelGroup).toBe(grpB.classOrGroup);
    expect(grpB.parallelGroup).toBe(grpA.classOrGroup);
  });

  it('generates Разговоры о важном from homeroom assignments', async () => {
    const plan = await parseUP(makeRealisticUP());
    useStore.getState().setCurriculumPlan(plan);

    const { addTeacher, setHomeroom } = useStore.getState();
    addTeacher({ id: 'hr1', name: 'Классная Мария Ивановна', initials: 'М.И.', subjects: [] });
    setHomeroom('5а', 'hr1');
    setHomeroom('5б', 'hr1');

    const { teachers, assignments, homeroomAssignments } = useStore.getState();
    const output = generateOutput(assignments, teachers, homeroomAssignments);

    const razg = output.filter((r) => r.subject === 'Разговоры о важном');
    expect(razg).toHaveLength(2);
    expect(razg.every((r) => r.countPerWeek === 1)).toBe(true);
    expect(razg.every((r) => r.type === 'class')).toBe(true);
    expect(new Set(razg.map((r) => r.classOrGroup))).toEqual(new Set(['5а', '5б']));
  });

  it('validation reports unassigned subjects', async () => {
    const plan = await parseUP(makeRealisticUP());
    const { teachers, assignments, homeroomAssignments } = useStore.getState();
    const issues = validateWorkload(plan, teachers, assignments, homeroomAssignments);
    // All subjects unassigned — should have warnings
    expect(issues.filter((i) => i.message.includes('не назначен')).length).toBeGreaterThan(0);
  });

  it('validation reports no issues when fully assigned within limits', async () => {
    const plan = await parseUP(makeRealisticUP());
    useStore.getState().setCurriculumPlan(plan);

    const { addTeacher, setAssignment, setHomeroom } = useStore.getState();
    addTeacher({ id: 't1', name: 'Учитель Один Иванович', initials: 'О.И.', subjects: [] });

    // Assign all subjects for all classes (using one teacher for simplicity)
    for (const grade of plan.grades) {
      for (const subject of grade.subjects) {
        for (const [cn, hours] of Object.entries(subject.hoursPerClass)) {
          if (hours > 0) setAssignment({ teacherId: 't1', className: cn, subject: subject.name, hoursPerWeek: hours });
        }
      }
    }
    // Set homeroom for all classes
    for (const cn of plan.classNames) {
      setHomeroom(cn, 't1');
    }

    const { teachers, assignments, homeroomAssignments } = useStore.getState();
    const issues = validateWorkload(plan, teachers, assignments, homeroomAssignments);
    const unassigned = issues.filter((i) => i.message.includes('не назначен'));
    expect(unassigned).toHaveLength(0);
  });

  it('output IDs are all unique', async () => {
    await parseUP(makeRealisticUP());
    const { addTeacher, setAssignment, setHomeroom } = useStore.getState();
    addTeacher({ id: 't1', name: 'Учитель А Б', initials: 'А.Б.', subjects: [] });
    addTeacher({ id: 't2', name: 'Учитель В Г', initials: 'В.Г.', subjects: [] });
    setAssignment({ teacherId: 't1', className: '5а', subject: 'Математика', hoursPerWeek: 5 });
    setAssignment({ teacherId: 't2', className: '5а', subject: 'Физкультура', hoursPerWeek: 3 });
    setAssignment({ teacherId: 't1', className: '6а', subject: 'Математика', hoursPerWeek: 5 });
    setHomeroom('5а', 't1');

    const { teachers, assignments, homeroomAssignments } = useStore.getState();
    const output = generateOutput(assignments, teachers, homeroomAssignments);
    const ids = output.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('detectGroupPairs returns empty when subjects mismatch', () => {
    const teachers = [
      { id: 'ta', name: 'А', initials: 'А.', subjects: [] },
      { id: 'tb', name: 'Б', initials: 'Б.', subjects: [] },
    ];
    const assignments = [
      { teacherId: 'ta', className: '5а', subject: 'Математика', hoursPerWeek: 5 },
      { teacherId: 'tb', className: '5а', subject: 'Физкультура', hoursPerWeek: 3 }, // different subject
    ];
    expect(detectGroupPairs(assignments, teachers)).toHaveLength(0);
  });
});
