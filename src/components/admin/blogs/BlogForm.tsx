'use client'

import { EditOutlined, SaveOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Button, Card, Form, Grid, Input, Radio } from 'antd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBlog, updateBlog } from '@/lib/admin/blogs-api'
import { getErrorMessage, getFieldErrors } from '@/lib/admin/errors'
import { useUnsavedChanges } from '@/lib/admin/use-unsaved-changes'
import type { Blog } from '@/types/blog'
import { toCreateBody, toFormValues, toUpdateBody, type BlogFormValues } from './blog-form-values'
import { DeleteBlogButton } from './DeleteBlogButton'
import { MarkdownField } from './MarkdownField'

const slugNotice = (typed: string, saved: string) =>
    typed && typed !== saved ? `Saved with slug “${saved}” because “${typed}” was taken.` : null

/** Create (no `blog`) or edit (with `blog`) a post. */
export const BlogForm = ({ blog }: { blog?: Blog }) => {
    const [form] = Form.useForm<BlogFormValues>()
    const { message, modal } = App.useApp()
    const router = useRouter()
    const queryClient = useQueryClient()
    const screens = Grid.useBreakpoint()
    const [saved, setSaved] = useState<Blog | undefined>(blog)
    const [dirty, setDirty] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [slugUnlocked, setSlugUnlocked] = useState(false)
    useUnsavedChanges(dirty)

    const slugLocked = saved?.status === 'published' && !slugUnlocked

    const mutation = useMutation({
        mutationFn: async (values: BlogFormValues) => {
            if (!saved) return { blog: await createBlog(toCreateBody(values)), changed: true }
            const body = toUpdateBody(values, saved)
            if (Object.keys(body).length === 0) return { blog: saved, changed: false }
            return { blog: await updateBlog(saved.id, body), changed: true }
        },
        onMutate: () => {
            setError(null)
            setNotice(null)
        },
        onSuccess: async ({ blog: result, changed }, values) => {
            const typedSlug = values.slug.trim().toLowerCase()
            const changedSlug = slugNotice(typedSlug, result.slug)
            setDirty(false)
            if (!changed) {
                message.info('No changes to save')
                return
            }
            queryClient.setQueryData(['blog', result.id], result)
            await queryClient.invalidateQueries({ queryKey: ['blogs'] })
            if (!saved) {
                message.success('Post created')
                if (changedSlug) message.warning(changedSlug, 6)
                router.replace(`/admin/blogs/${result.id}/edit`)
                return
            }
            setSaved(result)
            setSlugUnlocked(false)
            form.setFieldsValue({ slug: result.slug })
            setNotice(changedSlug)
            message.success('Post saved')
        },
        onError: (err) => {
            const fieldErrors = getFieldErrors(err)
            if (fieldErrors.length > 0) {
                form.setFields(fieldErrors.map(({ name, errors }) => ({ name: name as keyof BlogFormValues, errors })))
                setError('Please fix the highlighted fields.')
                return
            }
            setError(getErrorMessage(err))
        },
    })

    const unlockSlug = () =>
        modal.confirm({
            title: 'Change the slug?',
            content: 'Changing the slug of a published post breaks its existing links and search results.',
            okText: 'Change slug',
            okButtonProps: { danger: true },
            onOk: () => setSlugUnlocked(true),
        })

    const saveButton = (
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={mutation.isPending} block>
            {saved ? 'Save changes' : 'Save post'}
        </Button>
    )

    return (
        <Form<BlogFormValues>
            form={form}
            layout="vertical"
            initialValues={toFormValues(blog)}
            onValuesChange={() => setDirty(true)}
            onFinish={(values) => mutation.mutate(values)}
            className="pb-20 md:pb-0"
        >
            {error && <Alert type="error" showIcon title={error} className="mb-4" />}
            {notice && <Alert type="warning" showIcon title={notice} className="mb-4" closable />}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0">
                    <Form.Item
                        label="Title"
                        name="title"
                        rules={[
                            { required: true, whitespace: true, message: 'Title is required' },
                            { max: 200, message: 'Title must be at most 200 characters' },
                        ]}
                    >
                        <Input size="large" placeholder="Post title" />
                    </Form.Item>
                    <Form.Item
                        label="Content"
                        name="content"
                        rules={[{ required: true, whitespace: true, message: 'Content is required' }]}
                    >
                        <MarkdownField />
                    </Form.Item>
                </div>
                <Card size="small" className="h-fit lg:sticky lg:top-4">
                    <Form.Item label="Status" name="status">
                        <Radio.Group
                            optionType="button"
                            buttonStyle="solid"
                            options={[
                                { label: 'Draft', value: 'draft' },
                                { label: 'Published', value: 'published' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Slug"
                        name="slug"
                        extra={saved ? undefined : 'Leave empty to build it from the title.'}
                        rules={[
                            {
                                pattern: /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/,
                                message: 'Use letters, numbers and single dashes only',
                            },
                            { max: 200, message: 'Slug must be at most 200 characters' },
                        ]}
                    >
                        <Input
                            disabled={slugLocked}
                            addonAfter={
                                slugLocked ? (
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={unlockSlug}
                                        aria-label="Edit slug"
                                    >
                                        Edit slug
                                    </Button>
                                ) : undefined
                            }
                        />
                    </Form.Item>
                    <Form.Item
                        label="Excerpt"
                        name="excerpt"
                        extra="Shown in lists and link previews."
                        rules={[{ max: 500, message: 'Excerpt must be at most 500 characters' }]}
                    >
                        <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} showCount maxLength={500} />
                    </Form.Item>
                    {screens.md && saveButton}
                    {saved && (
                        <div className="mt-2">
                            <DeleteBlogButton
                                blog={saved}
                                block
                                onDeleted={() => {
                                    setDirty(false)
                                    router.replace('/admin/blogs')
                                }}
                            />
                        </div>
                    )}
                </Card>
            </div>
            {!screens.md && (
                <div className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white p-3">
                    {saveButton}
                </div>
            )}
        </Form>
    )
}
