export type QueryPrimitive = string | number | boolean | null | undefined;

export type QueryValue = QueryPrimitive | QueryValue[] | { [key: string]: QueryValue };
export type Params = Record<string, QueryValue>;

export interface QueryStringifyOptions {
  encode?: boolean;
}

export default class QueryHelper {
  static stringify<T extends Params>(params: T, options: QueryStringifyOptions = {}): string {
    const encodeValue = (value: QueryPrimitive): string => {
      if (value === null || value === undefined) return '';
      return options.encode ? encodeURIComponent(String(value)) : String(value);
    };

    const encodePair = (key: string, value: QueryValue): string => {
      const encodedKey = options.encode ? encodeURIComponent(key) : key;

      if (value === null || value === undefined) return encodedKey;

      if (Array.isArray(value)) {
        return value.map((v, i) => encodePair(`${key}[${i}]`, v)).join('&');
      }

      if (typeof value === 'object') {
        return Object.entries(value)
          .map(([k, v]) => encodePair(`${key}[${k}]`, v))
          .join('&');
      }

      const encodedValue = encodeValue(value);
      return `${encodedKey}=${encodedValue}`;
    };

    const encodeParams = (params: Params, prefix = ''): string => {
      return Object.entries(params)
        .map(([key, value]) => encodePair(prefix ? `${prefix}[${key}]` : key, value))
        .join('&');
    };

    const flattenParams = (params: Params | QueryValue[], prefix = ''): Params => {
      const result: Params = {};

      if (Array.isArray(params)) {
        params.forEach((value, index) => {
          const fullKey = `${prefix}[${index}]`;

          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            Object.assign(result, flattenParams(value, fullKey));
          } else {
            result[fullKey] = value;
          }
        });
      } else {
        for (const key in params) {
          if (Object.prototype.hasOwnProperty.call(params, key)) {
            const value = params[key];
            const fullKey = prefix ? `${prefix}[${key}]` : key;

            if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
              Object.assign(result, flattenParams(value, fullKey));
            } else {
              result[fullKey] = value;
            }
          }
        }
      }

      return result;
    };

    return encodeParams(flattenParams(params));
  }
  static parse(queryString: string): Params {
    const params: Params = {};
    const searchParams = new URLSearchParams(queryString);

    for (const [key, rawValue] of searchParams.entries()) {
      let obj: Params | QueryValue[] = params;
      const keys = key.replace(/\]/g, '').split('[');

      for (let j = 0; j < keys.length; j++) {
        const currentKey = keys[j]!;
        const nextKey = keys[j + 1];

        if (nextKey === undefined || nextKey === '') {
          const parsed: QueryPrimitive = isNaN(+rawValue) ? rawValue : Number(rawValue);

          if (Array.isArray(obj)) {
            obj[Number(currentKey)] = parsed;
          } else {
            obj[currentKey] = parsed;
          }
        } else if (/^\d+$/.test(nextKey)) {
          if (!Array.isArray(obj[currentKey as keyof typeof obj])) {
            if (!Array.isArray(obj)) {
              obj[currentKey] = [];
            }
          }
          obj = (Array.isArray(obj) ? obj[Number(currentKey)] : obj[currentKey]) as QueryValue[];
        } else {
          if (
            (Array.isArray(obj) && obj[Number(currentKey)] == null) ||
            (!Array.isArray(obj) && (obj[currentKey] == null || typeof obj[currentKey] !== 'object'))
          ) {
            if (Array.isArray(obj)) {
              obj[Number(currentKey)] = {};
            } else {
              obj[currentKey] = {};
            }
          }

          obj = (Array.isArray(obj) ? obj[Number(currentKey)] : obj[currentKey]) as Params;
        }
      }
    }

    return params;
  }
  static flatten(params: Params) {
    return QueryHelper.parse(QueryHelper.stringify(params));
  }
  static toQueryRecord(params: Params) {
    return Object.fromEntries(new URLSearchParams(QueryHelper.stringify(params)));
  }
}
