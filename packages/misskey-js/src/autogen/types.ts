Warning: truncated output (original token count: 302263)
... 160473 bytes omitted ...

/* eslint @typescript-eslint/naming-convention: 0 */
/* eslint @typescript-eslint/no-explicit-any: 0 */

export type paths = {
    '/admin/abuse-report/notification-recipient/create': {
        /**
         * admin/abuse-report/notification-recipient/create
         * @description No description provided.
         *
         *     **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
         *     **Credential required**: *Yes* / **Permission**: *write:admin:abuse-report:notification-recipient*
         */
        post: operations['admin___abuse-report___notification-recipient___create'];
    };
    '/admin/abuse-report/notification-recipient/delete': {
        /**
         * admin/abuse-report/notification-recipient/delete
         * @description No description provided.
         *
         *     **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
         *     **Credential required**: *Yes* / **Permission**: *write:admin:abuse-report:notification-recipient*
         */
        post: operations['admin___abuse-report___notification-recipient___delete'];
    };
    '/admin/abuse-report/notification-recipient/list': {
        /**
         * admin/abuse-report/notification-recipient/list
         * @description No description provided.
         *
         *     **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
         *     **Credential required**: *Yes* / **Permission**: *read:admin:abuse-report:notification-recipient*
         */
        post: operations['admin___abuse-report___notification-recipient___list'];
    };
    '/admin/abuse-report/notification-recipient/show': {
        /**
         * admin/abuse-report/notification-recipient/show
         * @description No description provided.
         *
         *     **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
         *     **Credential required**: *Yes* / **Permission**: *read:admin:abuse-report:notification-recipient*
         */
        post: operations['admin___abuse-report___notification-recipient___show'];
    };
    '/admin/abuse-report/notification-recipient/update': {
        /**
         * admin/abuse-report/notification-recipient/update
         * @description No description provided.
         *
         *     **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
         *     **Credential required**: *Yes* / **Permission**: *write:admin:abuse-report:notification-recipient*
         */
        post: operations['admin___abuse-report___notification-recipient___update'];
    };
    '/admin/abuse-user-reports': {
        /**
         * admin/abuse-user-reports
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:abuse-user-reports*
         */
        post: operations['admin___abuse-user-reports'];
    };
    '/admin/accounts/create': {
        /**
         * admin/accounts/create
         * @description No description provided.
         *
         *     **Credential required**: *No*
         */
        post: operations['admin___accounts___create'];
    };
    '/admin/accounts/delete': {
        /**
         * admin/accounts/delete
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:account*
         */
        post: operations['admin___accounts___delete'];
    };
    '/admin/accounts/find-by-email': {
        /**
         * admin/accounts/find-by-email
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:account*
         */
        post: operations['admin___accounts___find-by-email'];
    };
    '/admin/ad/create': {
        /**
         * admin/ad/create
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:ad*
         */
        post: operations['admin___ad___create'];
    };
    '/admin/ad/delete': {
        /**
         * admin/ad/delete
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:ad*
         */
        post: operations['admin___ad___delete'];
    };
    '/admin/ad/list': {
        /**
         * admin/ad/list
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:ad*
         */
        post: operations['admin___ad___list'];
    };
    '/admin/ad/update': {
        /**
         * admin/ad/update
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:ad*
         */
        post: operations['admin___ad___update'];
    };
    '/admin/announcements/create': {
        /**
         * admin/announcements/create
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:announcements*
         */
        post: operations['admin___announcements___create'];
    };
    '/admin/announcements/delete': {
        /**
         * admin/announcements/delete
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:announcements*
         */
        post: operations['admin___announcements___delete'];
    };
    '/admin/announcements/list': {
        /**
         * admin/announcements/list
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:announcements*
         */
        post: operations['admin___announcements___list'];
    };
    '/admin/announcements/update': {
        /**
         * admin/announcements/update
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:announcements*
         */
        post: operations['admin___announcements___update'];
    };
    '/admin/avatar-decorations/create': {
        /**
         * admin/avatar-decorations/create
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:avatar-decorations*
         */
        post: operations['admin___avatar-decorations___create'];
    };
    '/admin/avatar-decorations/delete': {
        /**
         * admin/avatar-decorations/delete
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:avatar-decorations*
         */
        post: operations['admin___avatar-decorations___delete'];
    };
    '/admin/avatar-decorations/list': {
        /**
         * admin/avatar-decorations/list
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:avatar-decorations*
         */
        post: operations['admin___avatar-decorations___list'];
    };
    '/admin/avatar-decorations/update': {
        /**
         * admin/avatar-decorations/update
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:avatar-decorations*
         */
        post: operations['admin___avatar-decorations___update'];
    };
    '/admin/captcha/current': {
        /**
         * admin/captcha/current
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:meta*
         */
        post: operations['admin___captcha___current'];
    };
    '/admin/captcha/save': {
        /**
         * admin/captcha/save
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:meta*
         */
        post: operations['admin___captcha___save'];
    };
    '/admin/delete-account': {
        /**
         * admin/delete-account
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:delete-account*
         */
        post: operations['admin___delete-account'];
    };
    '/admin/delete-all-files-of-a-user': {
        /**
         * admin/delete-all-files-of-a-user
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:delete-all-files-of-a-user*
         */
        post: operations['admin___delete-all-files-of-a-user'];
    };
    '/admin/drive/clean-remote-files': {
        /**
         * admin/drive/clean-remote-files
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:drive*
         */
        post: operations['admin___drive___clean-remote-files'];
    };
    '/admin/drive/cleanup': {
        /**
         * admin/drive/cleanup
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:drive*
         */
        post: operations['admin___drive___cleanup'];
    };
    '/admin/drive/files': {
        /**
         * admin/drive/files
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:drive*
         */
        post: operations['admin___drive___files'];
    };
    '/admin/drive/show-file': {
        /**
         * admin/drive/show-file
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:drive*
         */
        post: operations['admin___drive___show-file'];
    };
    '/admin/emoji/add': {
        /**
         * admin/emoji/add
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___add'];
    };
    '/admin/emoji/add-aliases-bulk': {
        /**
         * admin/emoji/add-aliases-bulk
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___add-aliases-bulk'];
    };
    '/admin/emoji/copy': {
        /**
         * admin/emoji/copy
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___copy'];
    };
    '/admin/emoji/delete': {
        /**
         * admin/emoji/delete
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___delete'];
    };
    '/admin/emoji/delete-bulk': {
        /**
         * admin/emoji/delete-bulk
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___delete-bulk'];
    };
    '/admin/emoji/import-zip': {
        /**
         * admin/emoji/import-zip
         * @description No description provided.
         *
         *     **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
         *     **Credential required**: *Yes*
         */
        post: operations['admin___emoji___import-zip'];
    };
    '/admin/emoji/list': {
        /**
         * admin/emoji/list
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:emoji*
         */
        post: operations['admin___emoji___list'];
    };
    '/admin/emoji/list-remote': {
        /**
         * admin/emoji/list-remote
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:emoji*
         */
        post: operations['admin___emoji___list-remote'];
    };
    '/admin/emoji/remove-aliases-bulk': {
        /**
         * admin/emoji/remove-aliases-bulk
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___remove-aliases-bulk'];
    };
    '/admin/emoji/set-aliases-bulk': {
        /**
         * admin/emoji/set-aliases-bulk
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___set-aliases-bulk'];
    };
    '/admin/emoji/set-category-bulk': {
        /**
         * admin/emoji/set-category-bulk
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___set-category-bulk'];
    };
    '/admin/emoji/set-license-bulk': {
        /**
         * admin/emoji/set-license-bulk
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___set-license-bulk'];
    };
    '/admin/emoji/update': {
        /**
         * admin/emoji/update
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
         */
        post: operations['admin___emoji___update'];
    };
    '/admin/federation/delete-all-files': {
        /**
         * admin/federation/delete-all-files
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:federation*
         */
        post: operations['admin___federation___delete-all-files'];
    };
    '/admin/federation/refresh-remote-instance-metadata': {
        /**
         * admin/federation/refresh-remote-instance-metadata
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:federation*
         */
        post: operations['admin___federation___refresh-remote-instance-metadata'];
    };
    '/admin/federation/remove-all-following': {
        /**
         * admin/federation/remove-all-following
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:federation*
         */
        post: operations['admin___federation___remove-all-following'];
    };
    '/admin/federation/update-instance': {
        /**
         * admin/federation/update-instance
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:federation*
         */
        post: operations['admin___federation___update-instance'];
    };
    '/admin/forward-abuse-user-report': {
        /**
         * admin/forward-abuse-user-report
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:resolve-abuse-user-report*
         */
        post: operations['admin___forward-abuse-user-report'];
    };
    '/admin/get-index-stats': {
        /**
         * admin/get-index-stats
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:index-stats*
         */
        post: operations['admin___get-index-stats'];
    };
    '/admin/get-table-stats': {
        /**
         * admin/get-table-stats
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:table-stats*
         */
        post: operations['admin___get-table-stats'];
    };
    '/admin/get-user-ips': {
        /**
         * admin/get-user-ips
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:user-ips*
         */
        post: operations['admin___get-user-ips'];
    };
    '/admin/invite/create': {
        /**
         * admin/invite/create
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:invite-codes*
         */
        post: operations['admin___invite___create'];
    };
    '/admin/invite/list': {
        /**
         * admin/invite/list
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:invite-codes*
         */
        post: operations['admin___invite___list'];
    };
    '/admin/meta': {
        /**
         * admin/meta
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:meta*
         */
        post: operations['admin___meta'];
    };
    '/admin/promo/create': {
        /**
         * admin/promo/create
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:promo*
         */
        post: operations['admin___promo___create'];
    };
    '/admin/queue/clear': {
        /**
         * admin/queue/clear
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:queue*
         */
        post: operations['admin___queue___clear'];
    };
    '/admin/queue/deliver-delayed': {
        /**
         * admin/queue/deliver-delayed
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:queue*
         */
        post: operations['admin___queue___deliver-delayed'];
    };
    '/admin/queue/inbox-delayed': {
        /**
         * admin/queue/inbox-delayed
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:queue*
         */
        post: operations['admin___queue___inbox-delayed'];
    };
    '/admin/queue/jobs': {
        /**
         * admin/queue/jobs
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:queue*
         */
        post: operations['admin___queue___jobs'];
    };
    '/admin/queue/pause': {
        /**
         * admin/queue/pause
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:queue*
         */
        post: operations['admin___queue___pause'];
    };
    '/admin/queue/promote-jobs': {
        /**
         * admin/queue/promote-jobs
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *write:admin:queue*
         */
        post: operations['admin___queue___promote-jobs'];
    };
    '/admin/queue/queue-stats': {
        /**
         * admin/queue/queue-stats
         * @description No description provided.
         *
         *     **Credential required**: *Yes* / **Permission**: *read:admin:queue*
         */
        post: operations['admin___queue___queue-stats'];
    };
    '/admin/queue/queues': {
        /**
         * admin/queue/qu…252152 tokens truncated…  500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
        };
    };
    users___relation: {
        requestBody: {
            content: {
                'application/json': {
                    userId: string | string[];
                };
            };
        };
        responses: {
            /** @description OK (with results) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': {
                        /** Format: id */
                        id: string;
                        isFollowing: boolean;
                        hasPendingFollowRequestFromYou: boolean;
                        hasPendingFollowRequestToYou: boolean;
                        isFollowed: boolean;
                        isBlocking: boolean;
                        isBlocked: boolean;
                        isMuted: boolean;
                        isRenoteMuted: boolean;
                    } | {
                        /** Format: id */
                        id: string;
                        isFollowing: boolean;
                        hasPendingFollowRequestFromYou: boolean;
                        hasPendingFollowRequestToYou: boolean;
                        isFollowed: boolean;
                        isBlocking: boolean;
                        isBlocked: boolean;
                        isMuted: boolean;
                        isRenoteMuted: boolean;
                    }[];
                };
            };
            /** @description Client error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Authentication error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Forbidden error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description I'm Ai */
            418: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
        };
    };
    'users___report-abuse': {
        requestBody: {
            content: {
                'application/json': {
                    /** Format: misskey:id */
                    userId: string;
                    comment: string;
                };
            };
        };
        responses: {
            /** @description OK (without any results) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
            };
            /** @description Client error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Authentication error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Forbidden error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description I'm Ai */
            418: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
        };
    };
    users___search: {
        requestBody: {
            content: {
                'application/json': {
                    query: string;
                    /** @default 0 */
                    offset?: number;
                    /** @default 10 */
                    limit?: number;
                    /**
                     * @default combined
                     * @enum {string}
                     */
                    origin?: 'local' | 'remote' | 'combined';
                    /** @default true */
                    detail?: boolean;
                };
            };
        };
        responses: {
            /** @description OK (with results) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['User'][];
                };
            };
            /** @description Client error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Authentication error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Forbidden error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description I'm Ai */
            418: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
        };
    };
    'users___search-by-username-and-host': {
        requestBody: {
            content: {
                'application/json': ({
                    username: string | null;
                } | {
                    host: string | null;
                }) & {
                    /** @default 10 */
                    limit?: number;
                    /** @default true */
                    detail?: boolean;
                };
            };
        };
        responses: {
            /** @description OK (with results) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['User'][];
                };
            };
            /** @description Client error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Authentication error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Forbidden error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description I'm Ai */
            418: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
        };
    };
    users___show: {
        requestBody: {
            content: {
                'application/json': ({
                    /** Format: misskey:id */
                    userId: string;
                } | {
                    userIds: string[];
                } | {
                    username: string;
                }) & {
                    /** @description The local host is represented with `null`. */
                    host?: string | null;
                };
            };
        };
        responses: {
            /** @description OK (with results) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['UserDetailed'] | components['schemas']['UserDetailed'][];
                };
            };
            /** @description Client error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Authentication error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Forbidden error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description I'm Ai */
            418: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
        };
    };
    'users___update-memo': {
        requestBody: {
            content: {
                'application/json': {
                    /** Format: misskey:id */
                    userId: string;
                    /** @description A personal memo for the target user. If null or empty, delete the memo. */
                    memo: string | null;
                };
            };
        };
        responses: {
            /** @description OK (without any results) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
            };
            /** @description Client error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Authentication error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Forbidden error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description I'm Ai */
            418: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
        };
    };
    v2___admin___emoji___list: {
        requestBody: {
            content: {
                'application/json': {
                    query?: {
                        updatedAtFrom?: string;
                        updatedAtTo?: string;
                        name?: string;
                        host?: string;
                        uri?: string;
                        publicUrl?: string;
                        originalUrl?: string;
                        type?: string;
                        aliases?: string;
                        category?: string;
                        license?: string;
                        isSensitive?: boolean;
                        localOnly?: boolean;
                        /**
                         * @default all
                         * @enum {string}
                         */
                        hostType?: 'local' | 'remote' | 'all';
                        roleIds?: string[];
                    } | null;
                    /** Format: misskey:id */
                    sinceId?: string;
                    /** Format: misskey:id */
                    untilId?: string;
                    sinceDate?: number;
                    untilDate?: number;
                    /** @default 10 */
                    limit?: number;
                    page?: number;
                    /**
                     * @default [
                     *       "-id"
                     *     ]
                     */
                    sortKeys?: ('+id' | '-id' | '+updatedAt' | '-updatedAt' | '+name' | '-name' | '+host' | '-host' | '+uri' | '-uri' | '+publicUrl' | '-publicUrl' | '+type' | '-type' | '+aliases' | '-aliases' | '+category' | '-category' | '+license' | '-license' | '+isSensitive' | '-isSensitive' | '+localOnly' | '-localOnly' | '+roleIdsThatCanBeUsedThisEmojiAsReaction' | '-roleIdsThatCanBeUsedThisEmojiAsReaction')[];
                };
            };
        };
        responses: {
            /** @description OK (with results) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': {
                        emojis: components['schemas']['EmojiDetailedAdmin'][];
                        count: number;
                        allCount: number;
                        allPages: number;
                    };
                };
            };
            /** @description Client error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Authentication error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Forbidden error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description I'm Ai */
            418: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
        };
    };
    'verify-email': {
        requestBody: {
            content: {
                'application/json': {
                    code: string;
                };
            };
        };
        responses: {
            /** @description OK (without any results) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
            };
            /** @description Client error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Authentication error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Forbidden error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description I'm Ai */
            418: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    'application/json': components['schemas']['Error'];
                };
            };
        };
    };
}

