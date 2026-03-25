/** Express 5: req.params-Werte können string | string[] sein. */
export function routeParamOne(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value
  if (typeof v !== 'string') {
    throw new TypeError('expected single route parameter')
  }
  return v
}
