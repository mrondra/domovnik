# accounting-sync/adapters/pohoda/mserver

The HTTP side of talking to a real Pohoda. One call: a `dataPack` posted as XML over Basic auth.

**Nothing here is verified and nothing here is tested.** ADR 0005 names verification on POHODA Start
as the precondition for this adapter and it has not happened, so the header names (`STW-Application`,
`STW-Instance`), the path (`/xml`), the authentication and the encoding of the answer all follow the
public documentation and nothing more. The contract test in `tests/` runs against this only when
`POHODA_MSERVER_URL` says a real instance is there.

The documents themselves are `../xml/`'s business, and that directory's README lists which of their
elements are unconfirmed.
