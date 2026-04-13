export const DEFAULT_DOCTORS_PAGE = 1;
export const DEFAULT_DOCTORS_PAGE_SIZE = 10;

export type DoctorPaginationMeta = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function normalizeDoctorPage(
  value?: string | string[],
): number {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (!normalizedValue) {
    return DEFAULT_DOCTORS_PAGE;
  }

  const parsedPage = Number.parseInt(normalizedValue, 10);

  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    return DEFAULT_DOCTORS_PAGE;
  }

  return parsedPage;
}

export function getDoctorsPaginationMeta(
  totalCount: number,
  requestedPage: number,
): DoctorPaginationMeta {
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / DEFAULT_DOCTORS_PAGE_SIZE),
  );
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

  return {
    currentPage,
    pageSize: DEFAULT_DOCTORS_PAGE_SIZE,
    totalCount,
    totalPages,
  };
}
