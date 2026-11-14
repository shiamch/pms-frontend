import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { getErrorMessage, getFieldErrors } from './errors'

const axiosError = (status: number | null, data?: unknown) => {
    const config = { headers: new AxiosHeaders() }
    const response =
        status === null
            ? undefined
            : { status, data, statusText: '', headers: {}, config }
    return new AxiosError('fail', 'ERR', config, undefined, response as never)
}

const fieldError = (path: string, msg: string) => ({
    type: 'field',
    value: '',
    msg,
    path,
    location: 'body',
})

const serverError = (msg: string) => ({
    ref: 'id',
    type: 'BadRequestError',
    msg,
    path: '/auth/login',
    method: 'POST',
    location: 'server',
    stack: null,
})

describe('getErrorMessage', () => {
    it('explains rate limiting', () => {
        expect(getErrorMessage(axiosError(429, { errors: [{ msg: 'x' }] }))).toBe(
            'Too many login attempts. Please wait 15 minutes and try again.',
        )
    })

    it('uses the first backend error message', () => {
        expect(getErrorMessage(axiosError(400, { errors: [serverError('Bad credentials')] }))).toBe(
            'Bad credentials',
        )
    })

    it('falls back to data.message', () => {
        expect(getErrorMessage(axiosError(400, { message: 'Nope' }))).toBe('Nope')
    })

    it('reports an unreachable server', () => {
        expect(getErrorMessage(axiosError(null))).toBe('Cannot reach the server.')
    })

    it('has a generic fallback', () => {
        expect(getErrorMessage(new Error('boom'))).toBe('Something went wrong.')
        expect(getErrorMessage(axiosError(500, {}))).toBe('Something went wrong.')
    })
})

describe('getFieldErrors', () => {
    it('maps validation errors to form fields, grouped by field', () => {
        const err = axiosError(400, {
            errors: [
                fieldError('title', 'Title is required'),
                fieldError('title', 'Too long'),
                fieldError('slug', 'Bad slug'),
            ],
        })
        expect(getFieldErrors(err)).toEqual([
            { name: 'title', errors: ['Title is required', 'Too long'] },
            { name: 'slug', errors: ['Bad slug'] },
        ])
    })

    it('ignores server errors whose path is a URL', () => {
        expect(getFieldErrors(axiosError(400, { errors: [serverError('x')] }))).toEqual([])
        expect(getFieldErrors(new Error('x'))).toEqual([])
    })
})
