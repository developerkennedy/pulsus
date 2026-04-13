export const DEFAULT_USERS_PAGE = 1;
export const DEFAULT_USERS_PAGE_SIZE = 10;

export type UserPaginationMeta = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function normalizeUserPage(
  value?: string | string[],
): number {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (!normalizedValue) {
    return DEFAULT_USERS_PAGE;
  }

  const parsedPage = Number.parseInt(normalizedValue, 10);

  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    return DEFAULT_USERS_PAGE;
  }

  return parsedPage;
}

export function getUsersPaginationMeta(
  totalCount: number,
  requestedPage: number,
): UserPaginationMeta {
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / DEFAULT_USERS_PAGE_SIZE),
  );
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

  return {
    currentPage,
    pageSize: DEFAULT_USERS_PAGE_SIZE,
    totalCount,
    totalPages,
  };
}
