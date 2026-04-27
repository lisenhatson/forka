FROM postgres:18

ARG DB_NAME
ARG DB_USER

ENV DB_NAME=${DB_NAME}
ENV DB_USER=${DB_USER}

RUN apt-get update && apt-get install -y --no-install-recommends \
    pgbackrest \
    nano \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/pgbackrest && \
    chown 999:999 /etc/pgbackrest && \
    chmod 750 /etc/pgbackrest

RUN mkdir -p /var/log/pgbackrest && \
    chown 999:999 /var/log/pgbackrest && \
    chmod 770 /var/log/pgbackrest

RUN mkdir -p /var/log/postgres && \
    chown 999:999 /var/log/postgres && \
    chmod 770 /var/log/postgres

EXPOSE 5432 8432

CMD ["postgres"]
