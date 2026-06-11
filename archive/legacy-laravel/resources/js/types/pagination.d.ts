export type PaginationMetaLink = {
    url: string | null;
    label: string;
    page?: number | null;
    active: boolean;
};

export type PaginationLinks = {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
};

type BasePaginationMeta = {
    path: string;
    per_page: number;
};

export type LengthAwarePaginationMeta = BasePaginationMeta & {
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationMetaLink[];
    to: number | null;
    total: number;
};

export type CursorPaginationMeta = BasePaginationMeta & {
    next_cursor: string | null;
    prev_cursor: string | null;
};

export type PaginationMeta = LengthAwarePaginationMeta | CursorPaginationMeta;

export type LengthAwarePaginatedResponse<T> = {
    data: T[];
    links: PaginationLinks;
    meta: LengthAwarePaginationMeta;
};

export type CursorPaginatedResponse<T> = {
    data: T[];
    links: PaginationLinks;
    meta: CursorPaginationMeta;
};

export type PaginatedResponse<T> = {
    data: T[];
    links: PaginationLinks;
    meta: PaginationMeta;
};
