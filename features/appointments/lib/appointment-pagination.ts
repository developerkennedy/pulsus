export const DEFAULT_APPOINTMENTS_PAGE = 1;
export const DEFAULT_APPOINTMENTS_PAGE_SIZE = 10;

export type AppointmentPaginationMeta = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function normalizeAppointmentPage(value?: string | string[]): number {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (!normalizedValue) {
    return DEFAULT_APPOINTMENTS_PAGE;
  }

  const parsedPage = Number.parseInt(normalizedValue, 10);

  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    return DEFAULT_APPOINTMENTS_PAGE;
  }

  return parsedPage;
}

export function getAppointmentsPaginationMeta(
  totalCount: number,
  requestedPage: number,
): AppointmentPaginationMeta {
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / DEFAULT_APPOINTMENTS_PAGE_SIZE),
  );
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

  return {
    currentPage,
    pageSize: DEFAULT_APPOINTMENTS_PAGE_SIZE,
    totalCount,
    totalPages,
  };
}
