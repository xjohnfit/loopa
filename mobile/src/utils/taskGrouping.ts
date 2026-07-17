import { Category, Recurrence } from '../api/apiSlice';

interface CategorizedTask {
  category_id: string;
  time: string;
  recurrence: Recurrence;
}

export interface TaskSection<T> {
  key: string;
  groupLabel: string | null;
  title: string;
  color: string;
  data: T[];
}

function groupByCategory<T extends CategorizedTask>(
  tasks: T[],
  categories: Category[],
  groupKey: string,
  groupLabel: string | null
): TaskSection<T>[] {
  const byCategory = new Map<string, T[]>();
  for (const task of tasks) {
    const group = byCategory.get(task.category_id) ?? [];
    group.push(task);
    byCategory.set(task.category_id, group);
  }

  const sections: TaskSection<T>[] = [];
  let first = true;
  for (const category of categories) {
    const group = byCategory.get(category.id);
    if (group?.length) {
      sections.push({
        key: `${groupKey}-${category.id}`,
        groupLabel: first ? groupLabel : null,
        title: category.name,
        color: category.color,
        data: [...group].sort((a, b) => a.time.localeCompare(b.time)),
      });
      first = false;
    }
  }
  return sections;
}

/** Manage Tasks: every task there is already recurring, so a flat category grouping is enough. */
export function groupTasksByCategory<T extends CategorizedTask>(
  tasks: T[],
  categories: Category[] | undefined
): TaskSection<T>[] {
  return groupByCategory(tasks, categories ?? [], 'all', null);
}

/** Daily view: the recurring routine is the core of the app, so it's grouped and shown
 * first, with one-off "just for today" tasks split into their own group after — category
 * grouping applies within each. */
export function groupTasksByRecurrenceAndCategory<T extends CategorizedTask>(
  tasks: T[],
  categories: Category[] | undefined
): TaskSection<T>[] {
  const cats = categories ?? [];
  const recurring = tasks.filter((t) => t.recurrence === 'recurring');
  const once = tasks.filter((t) => t.recurrence === 'once');
  return [
    ...groupByCategory(recurring, cats, 'recurring', 'RECURRING'),
    ...groupByCategory(once, cats, 'once', 'JUST FOR TODAY'),
  ];
}
