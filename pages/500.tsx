import Head from 'next/head'
import React from 'react'

export default function Custom500() {
  return (
    <>
      <Head>
        <title>Server error</title>
      </Head>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h1>500 - Server-side error occurred</h1>
      </div>
    </>
  )
}
