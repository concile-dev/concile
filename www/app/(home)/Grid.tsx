/** The structural grid from v2: three hairlines at the quarter points.
 *
 * 1px children rather than gradient stops. A 1px band inside a gradient is not
 * reliable on an element this tall, which is how the same grid ended up
 * invisible in v2 before it was measured. */
export function GridLines() {
  return (
    <div className="hp-gridlines" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}
