import { EditorSelection } from "@codemirror/state"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import React from "react"
import { Params, useParams } from "react-router-dom"
import { useEvent } from "react-use"
import { z } from "zod"
import { CommandMenu } from "../components/command-menu"
import { DropdownMenu } from "../components/dropdown-menu"
import { FullscreenContainer } from "../components/fullscreen-container"
import { FullscreenNoteForm } from "../components/fullscreen-note-form"
import {
  ChevronLeftIcon16,
  ChevronRightIcon16,
  CopyIcon16,
  EditIcon16,
  ExternalLinkIcon16,
  MinimizeIcon16,
  MoreIcon16,
  NoteIcon16,
} from "../components/icons"
import { Markdown } from "../components/markdown"
import { Panels } from "../components/panels"
import { githubRepoAtom } from "../global-atoms"
import { NotePanel } from "../panels/note"
import { useUpsertNote } from "../utils/github-sync"
import { useIsFullscreen } from "../utils/use-is-fullscreen"
import { useNoteById } from "../utils/use-note-by-id"
import { useSearchParam } from "../utils/use-search-param"
import * as Dialog from "@radix-ui/react-dialog"
import { IconButton } from "../components/icon-button"
import { NoteList } from "../components/note-list"
import { Button } from "../components/button"
import { NoteEditor } from "../components/note-editor"

export function NotePage() {
  const isFullscreen = useIsFullscreen()
  const params = useParams()

  const { "*": noteId = "" } = params
  const note = useNoteById(noteId)

  return (
    <Dialog.Root open onOpenChange={() => {}}>
      <Dialog.Content className="fixed inset-0 overflow-auto bg-bg outline-none">
        <header className="xborder-b sticky top-0 z-10 grid grid-cols-3 items-center justify-between border-border-secondary bg-gradient-to-b from-bg to-bg-backdrop p-2 backdrop-blur-md">
          <div className="flex gap-2 justify-self-start">
            <IconButton aria-label="Exit fullscreen" shortcut={["esc"]}>
              <MinimizeIcon16 />
            </IconButton>
            <div>
              <IconButton
                aria-label="Back"
                // onClick={() => navigate(-1)}
                shortcut={["⌘", "["]}
                disabled
                // TODO: Disable when at the beginning of history
              >
                <ChevronLeftIcon16 />
              </IconButton>
              <IconButton
                aria-label="Forward"
                // onClick={() => navigate(1)}
                shortcut={["⌘", "]"]}
                disabled
                // TODO: Disable when at the end of history
              >
                <ChevronRightIcon16 />
              </IconButton>
            </div>
          </div>
          <span className="justify-self-center truncate font-mono tracking-wide text-text-secondary">
            {noteId}.md
          </span>
          <div className="flex gap-2 justify-self-end">
            <IconButton aria-label="Note actions" shortcut={["⌘", "."]}>
              <MoreIcon16 />
            </IconButton>
            {/* <Button>Cancel</Button>
            <Button variant="primary">Save</Button> */}
          </div>
        </header>
        {/* <div className="grid grid-cols-2"> */}
        <div className=" p-4 md:p-10 lg:p-12">
          <div className="mx-auto max-w-3xl">
            <NoteEditor defaultValue={note?.rawBody ?? ""} />
            {/* <Markdown>{note?.rawBody ?? ""}</Markdown> */}

            {/* </div>
          <div className=" p-4 md:p-10 lg:p-12">
            <Markdown>{note?.rawBody ?? ""}</Markdown> */}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )

  if (isFullscreen) {
    return (
      <>
        <CommandMenu />
        <FullscreenNotePage params={params} />
      </>
    )
  }

  return (
    <Panels>
      <CommandMenu />
      <NotePanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}

type FullscreenNotePageProps = {
  params: Params<string>
}

function FullscreenNotePage({ params }: FullscreenNotePageProps) {
  const { "*": id = "" } = params
  const note = useNoteById(id)
  const githubRepo = useAtomValue(githubRepoAtom)
  const upsertNote = useUpsertNote()
  const editorRef = React.useRef<ReactCodeMirrorRef>(null)
  // TODO: Save draft in local storage

  const parseIsEditing = React.useCallback((value: unknown) => {
    return typeof value === "string" ? value === "true" : false
  }, [])

  const [isEditing, setIsEditing] = useSearchParam("edit", {
    defaultValue: false,
    schema: z.boolean(),
    replace: true,
    parse: parseIsEditing,
  })

  const switchToEditing = React.useCallback(() => {
    setIsEditing(true)
    // Wait for the editor to mount
    setTimeout(() => {
      const view = editorRef.current?.view
      if (view) {
        // Focus the editor
        view.focus()
        // Move cursor to end of document
        view.dispatch({
          selection: EditorSelection.cursor(view.state.doc.sliceString(0).length),
        })
      }
    }, 1)
  }, [setIsEditing])

  const switchToViewing = React.useCallback(() => {
    setIsEditing(false)
  }, [setIsEditing])

  useEvent("keydown", (event) => {
    // Copy markdown with `command + c` if no text is selected
    if (event.metaKey && event.key == "c" && !window.getSelection()?.toString()) {
      copy(note?.rawBody || "")
      event.preventDefault()
    }

    // Copy id with `command + shift + c`
    if (event.metaKey && event.shiftKey && event.key == "c") {
      copy(id)
      event.preventDefault()
    }

    // Switch to editing with `e`
    if (event.key === "e" && !isEditing) {
      switchToEditing()
      event.preventDefault()
    }
  })

  if (!note) {
    return (
      <FullscreenContainer title="Note" icon={<NoteIcon16 />} elevation={0}>
        <div className="grid w-full flex-grow place-items-center">Not found</div>
      </FullscreenContainer>
    )
  }

  return (
    <FullscreenContainer
      title="Note"
      icon={<NoteIcon16 />}
      elevation={1}
      actions={
        <>
          <DropdownMenu.Item
            key="edit"
            icon={<EditIcon16 />}
            shortcut={["E"]}
            disabled={isEditing}
            onSelect={switchToEditing}
          >
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            key="copy-markdown"
            icon={<CopyIcon16 />}
            shortcut={["⌘", "C"]}
            onSelect={() => copy(note.rawBody)}
          >
            Copy markdown
          </DropdownMenu.Item>
          <DropdownMenu.Item
            key="copy-id"
            icon={<CopyIcon16 />}
            shortcut={["⌘", "⇧", "C"]}
            onSelect={() => copy(id)}
          >
            Copy ID
          </DropdownMenu.Item>
          {githubRepo ? (
            <>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                icon={<ExternalLinkIcon16 />}
                href={`https://github.com/${githubRepo.owner}/${githubRepo.name}/blob/main/${id}.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in GitHub
              </DropdownMenu.Item>
            </>
          ) : null}
        </>
      }
    >
      {!isEditing ? (
        <div className="w-full flex-grow p-4">
          <Markdown onChange={(markdown) => upsertNote({ id, rawBody: markdown })}>
            {note.rawBody}
          </Markdown>
        </div>
      ) : (
        <FullscreenNoteForm
          id={id}
          defaultValue={note.rawBody}
          editorRef={editorRef}
          onSubmit={switchToViewing}
          onCancel={switchToViewing}
        />
      )}
    </FullscreenContainer>
  )
}
