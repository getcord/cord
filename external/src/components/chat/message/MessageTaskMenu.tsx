import { useMemo } from 'react';
import type { TaskFragment } from 'external/src/graphql/operations.ts';
import { Menu2 } from 'external/src/components/ui2/Menu2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

type Props = {
  task: TaskFragment;
  setDone: (done: boolean, eventLogMethod: string) => void;
  removeTask: () => void;
  closeMenu: () => void;
  onClickReassign: () => void;
  canRemoveTask: boolean;
};

export function MessageTaskMenu({
  task,
  setDone,
  removeTask,
  closeMenu,
  onClickReassign,
  canRemoveTask,
}: Props) {
  const menuItems = useMemo(() => {
    const items = [];
    if (canRemoveTask) {
      items.push({
        id: 'removeTask' as const,
        title: 'Remove task from message',
        icon: 'Trash' as const,
        onClick: () => removeTask(),
      });
    }
    items.push({
      id: 'toggleDone' as const,
      title: task.done ? 'Mark as not done' : 'Mark as done',
      icon: task.done ? ('Square' as const) : ('CheckSquare' as const),
      onClick: () => {
        setDone(!task.done, 'task-menu');
      },
    });
    items.push({
      id: 'reassign' as const,
      title: task.assignees.length ? 'Reassign' : 'Assign',
      icon: 'Users' as const,
      onClick: onClickReassign,
    });
    return items;
  }, [
    task.done,
    task.assignees.length,
    onClickReassign,
    removeTask,
    setDone,
    canRemoveTask,
  ]);

  return (
    <Menu2 fullWidth={true}>
      {menuItems.map((menuItem) => {
        return (
          <MenuItem2
            key={menuItem.id}
            leftItem={<Icon2 name={menuItem.icon} />}
            label={menuItem.title}
            onClick={() => {
              closeMenu();
              menuItem.onClick();
            }}
          />
        );
      })}
    </Menu2>
  );
}
