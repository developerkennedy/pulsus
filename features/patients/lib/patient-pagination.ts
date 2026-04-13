export const DEFAULT_PATIENTS_PAGE = 1;
export const DEFAULT_PATIENTS_PAGE_SIZE = 10;

export type PatientPaginationMeta = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function normalizePatientPage(value?: string | string[]): number {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (!normalizedValue) {
    return DEFAULT_PATIENTS_PAGE;
  }

  const parsedPage = Number.parseInt(normalizedValue, 10);

  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    return DEFAULT_PATIENTS_PAGE;
  }

  return parsedPage;
}

export function getPatientsPaginationMeta(
  totalCount: number,
  requestedPage: number,
): PatientPaginationMeta {
 
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / DEFAULT_PATIENTS_PAGE_SIZE),
  );
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

  return {
    currentPage,
    pageSize: DEFAULT_PATIENTS_PAGE_SIZE,
    totalCount,
    totalPages,
  };
}
