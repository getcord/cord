import type {
  LinearIssuePreviewData,
  JiraIssuePreviewData,
  TaskPreviewData,
} from 'common/types/index.ts';

export function isJiraTask(
  data: TaskPreviewData,
): data is JiraIssuePreviewData {
  const jiraSpecificProp: keyof JiraIssuePreviewData = 'key';
  return jiraSpecificProp in data;
}

export function isLinearTask(
  data: TaskPreviewData,
): data is LinearIssuePreviewData {
  const linearSpecificProp: keyof LinearIssuePreviewData = 'orgName';
  return linearSpecificProp in data;
}
