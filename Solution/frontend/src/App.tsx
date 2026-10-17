  import { useEffect, useRef, useState, type FormEvent } from 'react'



  import './App.css'



  type ShelvedBook = {

    id?: string

    Id?: string

    title?: string

    Title?: string

    author?: string

    Author?: string

    coverUrl?: string

    CoverUrl?: string

    ownerId?: string

    OwnerId?: string

    catalogBookId?: string

    CatalogBookId?: string

    status?: string

    Status?: string

    rating?: number

    Rating?: number

    description?: string
    Description?: string
    pageCount?: number
    PageCount?: number
    currentPage?: number
    CurrentPage?: number

  }

  type ReadingStatus = 'To read' | 'Currently reading' | 'Finished'

  const getReadingStatus = (book: ShelvedBook): ReadingStatus => {
    const status = book.status ?? book.Status
    return status === 'Currently reading' || status === 'Finished'
      ? status
      : 'To read'
  }

  const getSavedRating = (book: ShelvedBook) =>
    book.rating ?? book.Rating ?? 0

  type ReadingList = {
    id?: string
    Id?: string
    ownerId?: string
    OwnerId?: string
    name?: string
    Name?: string
    description?: string
    Description?: string
    isShared?: boolean
    IsShared?: boolean
    bookIds?: string[]
    BookIds?: string[]
    createdAt?: string
    CreatedAt?: string
  }

  type ReadingListDetail = {
    list: ReadingList
    books: ShelvedBook[]
  }

  type GoogleBookResult = {
    id: string
    volumeInfo?: {
      title?: string
      authors?: string[]
      description?: string
      imageLinks?: { thumbnail?: string; smallThumbnail?: string }
      publishedDate?: string
      pageCount?: number
      publisher?: string
      infoLink?: string
      categories?: string[]
    }
  }

  type CatalogBook = {
    id?: string
    Id?: string
    externalGoogleBooksId?: string
    ExternalGoogleBooksId?: string
    title?: string
    Title?: string
    authors?: string[]
    Authors?: string[]
    description?: string
    Description?: string
    coverImageUrl?: string
    CoverImageUrl?: string
    publishedDate?: string
    PublishedDate?: string
    categories?: string[]
    Categories?: string[]
    dateAdded?: string
    DateAdded?: string
  }

  type AdminUserSummary = {
    accountId: string
    username: string
    email: string
    role: 'Reader' | 'Admin'
    registrationDate?: string | null
    personalBookCount: number
    readingListCount: number
  }

  type AdminUserProfile = AdminUserSummary & {
    personalBooks: ShelvedBook[]
    readingLists: (ReadingList & {
      books?: { id: string; title: string }[]
    })[]
  }



  function App() {



    const [isRegistering, setIsRegistering] = useState(false)



    const [userRole, setUserRole] = useState<'Reader' | 'Admin'>('Reader')

    const [isLoggedIn, setIsLoggedIn] = useState(false)



    const [activePage, setActivePage] = useState('Home')



    const [username, setUsername] = useState('')



    const [registerEmail, setRegisterEmail] = useState('')



    const [registerPassword, setRegisterPassword] = useState('')



    const [registerMessage, setRegisterMessage] = useState('')



    const [isRegisteringRequest, setIsRegisteringRequest] = useState(false)



    const [loginEmail, setLoginEmail] = useState('')



    const [loginPassword, setLoginPassword] = useState('')



    const [loginMessage, setLoginMessage] = useState('')



    const [isLoggingIn, setIsLoggingIn] = useState(false)



    const [authToken, setAuthToken] = useState<string | null>(null)

    const [profileUsername, setProfileUsername] = useState('')

    const [profileEmail, setProfileEmail] = useState('')

    const [profilePassword, setProfilePassword] = useState('')
    const [profileMessage, setProfileMessage] = useState('')
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [readingGoal, setReadingGoal] = useState(12)








    const [books, setBooks] = useState<ShelvedBook[]>([])
    const [readingLists, setReadingLists] = useState<ReadingList[]>([])
    const [listsLoading, setListsLoading] = useState(false)
    const [listsMessage, setListsMessage] = useState('')
    const [showCreateList, setShowCreateList] = useState(false)
    const [showListBookPicker, setShowListBookPicker] = useState(false)
    const [newListName, setNewListName] = useState('')
    const [newListDescription, setNewListDescription] = useState('')
    const [selectedList, setSelectedList] = useState<ReadingListDetail | null>(null)
    const [listActionLoading, setListActionLoading] = useState(false)
    const [bookToAdd, setBookToAdd] = useState('')

    const [bookFilter, setBookFilter] = useState('All')
    const [bookSearch, setBookSearch] = useState('')
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
    const [bookUpdateMessage, setBookUpdateMessage] = useState('')
    const [updatingBook, setUpdatingBook] = useState(false)
    const [ratingModalBookId, setRatingModalBookId] = useState<string | null>(null)
    const [ratingDraft, setRatingDraft] = useState(0)
    const promptedRatingBookIds = useRef(new Set<string>())

    const [booksLoading, setBooksLoading] = useState(false)

    const [booksMessage, setBooksMessage] = useState('')

    const [addingCatalogBookId, setAddingCatalogBookId] = useState<
      string | null
    >(null)
    const [catalogBookAddMessages, setCatalogBookAddMessages] = useState<
      Record<string, { message: string; failed: boolean }>
    >({})

    const [searchQuery, setSearchQuery] = useState('')

    const [searchResults, setSearchResults] = useState<GoogleBookResult[]>([])

    const [searchLoading, setSearchLoading] = useState(false)

    const [searchMessage, setSearchMessage] = useState('')

    const [addingBookId, setAddingBookId] = useState<string | null>(null)

    const [addedBookIds, setAddedBookIds] = useState<string[]>([])

    const [catalogGoogleBookIds, setCatalogGoogleBookIds] = useState<Set<string>>(
      () => new Set(),
    )
    const [catalogBooks, setCatalogBooks] = useState<CatalogBook[]>([])
    const [catalogSearch, setCatalogSearch] = useState('')
    const [catalogLoading, setCatalogLoading] = useState(false)
    const [catalogMessage, setCatalogMessage] = useState('')
    const [catalogRefreshKey, setCatalogRefreshKey] = useState(0)
    const [adminSection, setAdminSection] = useState<
      'dashboard' | 'catalog' | 'users'
    >('dashboard')
    const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([])
    const [adminUsersLoading, setAdminUsersLoading] = useState(false)
    const [adminUsersLoadFailed, setAdminUsersLoadFailed] = useState(false)
    const [adminUsersMessage, setAdminUsersMessage] = useState('')
    const [adminUsersFailed, setAdminUsersFailed] = useState(false)
    const [adminUserSearch, setAdminUserSearch] = useState('')
    const [adminRoleFilter, setAdminRoleFilter] = useState<
      'All' | 'Reader' | 'Admin'
    >('All')
    const [selectedAdminUser, setSelectedAdminUser] =
      useState<AdminUserProfile | null>(null)
    const [adminUserProfileLoading, setAdminUserProfileLoading] =
      useState(false)
    const [adminUserActionId, setAdminUserActionId] = useState<string | null>(
      null,
    )
    const [catalogActionBookId, setCatalogActionBookId] = useState<
      string | null
    >(null)
    const [catalogDeleteMessage, setCatalogDeleteMessage] = useState('')
    const [catalogDeleteFailed, setCatalogDeleteFailed] = useState(false)
    const [editingCatalogBookId, setEditingCatalogBookId] = useState<
      string | null
    >(null)
    const [catalogEditDraft, setCatalogEditDraft] = useState({
      title: '',
      authors: '',
      description: '',
      coverImageUrl: '',
      publishedDate: '',
      categories: '',
    })
    const [catalogEditMessage, setCatalogEditMessage] = useState('')
    const [catalogEditFailed, setCatalogEditFailed] = useState(false)



    const handleRegisterSubmit = async (



      event: FormEvent<HTMLFormElement>,



    ) => {



      event.preventDefault()



      setRegisterMessage('')



      setIsRegisteringRequest(true)



      try {



        const response = await fetch('/Auth/Register', {



          method: 'POST',



          headers: { 'Content-Type': 'application/json' },



          body: JSON.stringify({



            username,



            email: registerEmail,



            password: registerPassword,



          }),



        })



        const responseText = await response.text()



        if (!response.ok) {



          let message = responseText



          try {



            const parsed = JSON.parse(responseText)



            message =



              typeof parsed === 'string'



                ? parsed



                : parsed.title ?? parsed.message ?? responseText



          } catch {



            // Keep the original response text.



          }



          throw new Error(



            message || `Registration failed (${response.status}).`,



          )



        }



        setLoginEmail(registerEmail)



        setLoginPassword('')



        setRegisterPassword('')



        setRegisterMessage('Account created successfully! You can now log in.')



      } catch (error) {



        setRegisterMessage(



          error instanceof Error



            ? error.message



            : 'Could not connect to the server. Please try again.',



        )



      } finally {



        setIsRegisteringRequest(false)



      }



    }



    const openBookRating = (book: ShelvedBook) => {
      const id = book.id ?? book.Id

      if (
        !id ||
        getReadingStatus(book) !== 'Finished' ||
        getSavedRating(book) > 0 ||
        promptedRatingBookIds.current.has(id)
      ) {
        return
      }

      promptedRatingBookIds.current.add(id)
      setBookUpdateMessage('')
      setRatingDraft(0)
      setRatingModalBookId(id)
    }

    const closeBookRating = () => {
      if (ratingModalBookId) {
        promptedRatingBookIds.current.delete(ratingModalBookId)
      }
      setRatingModalBookId(null)
    }

    const selectBook = (book: ShelvedBook) => {
      closeBookRating()
      setSelectedBookId(book.id ?? book.Id ?? null)
      setBookUpdateMessage('')

      if (
        getReadingStatus(book) === 'Finished' &&
        getSavedRating(book) === 0
      ) {
        openBookRating(book)
      } else {
        closeBookRating()
      }
    }

    const loadMyBooks = async (token: string) => 
    {

      setBooksLoading(true)

      setBooksMessage('')

      if (!token) {
        setBooksMessage('Please log in again to view your books.')
        setBooksLoading(false)
        return
      }



      try {

        const response = await fetch('/Books', {

          headers: {

            Authorization: `Bearer ${authToken}`,

          },

        })



        if (!response.ok) {

          const responseText = await response.text()

          throw new Error(

            responseText || `Could not load books (${response.status}).`,

          )

        }



        const data = (await response.json()) as ShelvedBook[]
        setBooks(data)

        if (activePage === 'Your Books' && selectedBookId) {
          const selectedBook = data.find(
            (book) => (book.id ?? book.Id) === selectedBookId,
          )

          if (
            selectedBook &&
            getReadingStatus(selectedBook) === 'Finished' &&
            getSavedRating(selectedBook) === 0
          ) {
            openBookRating(selectedBook)
          } else if (ratingModalBookId === selectedBookId) {
            closeBookRating()
          }
        }

      } catch (error) {

        setBooksMessage(

          error instanceof Error

            ? error.message

            : 'Could not connect to the server. Please try again.',

        )

      } finally {

        setBooksLoading(false)

      }

    }

    const addCatalogBookToMyBooks = async (
      catalogBookId: string,
      catalogTitle: string,
    ) => {
      if (!authToken || userRole !== 'Reader') {
        setCatalogBookAddMessages((current) => ({
          ...current,
          [catalogBookId]: {
            message: 'Please log in as a Reader to add this book.',
            failed: true,
          },
        }))
        return
      }

      setAddingCatalogBookId(catalogBookId)
      setCatalogBookAddMessages((current) => {
        const updated = { ...current }
        delete updated[catalogBookId]
        return updated
      })

      try {
        const response = await fetch(
          `/Books/from-catalog/${encodeURIComponent(catalogBookId)}`,
          {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + authToken },
          },
        )
        const responseText = await response.text()
        if (!response.ok) {
          let message = responseText
          try {
            const parsed = JSON.parse(responseText)
            message =
              typeof parsed === 'string'
                ? parsed
                : parsed.message ?? parsed.title ?? responseText
          } catch {
            if (!message) {
              message = `Could not add this book (${response.status}).`
            }
          }
          throw new Error(
            message || `Could not add this book (${response.status}).`,
          )
        }

        let addedBook: ShelvedBook & { alreadyInLibrary?: boolean }
        try {
          addedBook = JSON.parse(responseText) as ShelvedBook & {
            alreadyInLibrary?: boolean
          }
        } catch {
          throw new Error(
            'The server returned an unexpected response while adding this book.',
          )
        }

        const addedId = addedBook.id ?? addedBook.Id
        setBooks((current) => {
          if (
            current.some(
              (personalBook) =>
                (personalBook.catalogBookId ??
                  personalBook.CatalogBookId) === catalogBookId ||
                (addedId && (personalBook.id ?? personalBook.Id) === addedId),
            )
          ) {
            return current
          }
          return [addedBook, ...current]
        })
        setCatalogBookAddMessages((current) => ({
          ...current,
          [catalogBookId]: {
            message: addedBook.alreadyInLibrary
              ? 'Already in My Books.'
              : `“${catalogTitle}” was added to My Books.`,
            failed: false,
          },
        }))
      } catch (error) {
        setCatalogBookAddMessages((current) => ({
          ...current,
          [catalogBookId]: {
            message:
              error instanceof Error
                ? error.message
                : 'Could not add this book. Please try again.',
            failed: true,
          },
        }))
      } finally {
        setAddingCatalogBookId(null)
      }
    }

    const loadReadingLists = async () => {
      if (!authToken) {
        setListsMessage('Please log in again to view your reading lists.')
        return
      }

      setListsLoading(true)
      setListsMessage('')

      try {
        const response = await fetch('/ReadingLists', {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (!response.ok) {
          throw new Error(`Could not load reading lists (${response.status}).`)
        }

        const data = (await response.json()) as ReadingList[]
        setReadingLists(data)
      } catch (error) {
        setListsMessage(
          error instanceof Error ? error.message : 'Could not load reading lists.',
        )
      } finally {
        setListsLoading(false)
      }
    }

    const createReadingList = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!authToken || !newListName.trim()) {
        setListsMessage('Please enter a list name.')
        return
      }

      setListActionLoading(true)
      setListsMessage('')

      try {
        const response = await fetch('/ReadingLists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            name: newListName.trim(),
            description: newListDescription.trim(),
            isShared: false,
          }),
        })

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || `Could not create list (${response.status}).`)
        }

        const created = (await response.json()) as ReadingList
        setReadingLists((current) => [created, ...current])
        setNewListName('')
        setNewListDescription('')
        setShowCreateList(false)
        setListsMessage('Reading list created successfully.')
      } catch (error) {
        setListsMessage(
          error instanceof Error ? error.message : 'Could not create this list.',
        )
      } finally {
        setListActionLoading(false)
      }
    }

    const openReadingList = async (list: ReadingList) => {
      const id = list.id ?? list.Id

      if (!authToken || !id) return

      setListActionLoading(true)
      setListsMessage('')

      try {
        const response = await fetch(`/ReadingLists/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (!response.ok) {
          throw new Error(`Could not open list (${response.status}).`)
        }

        const detail = (await response.json()) as ReadingListDetail
        setSelectedList(detail)
        setReadingLists((current) =>
          current.map((item) =>
            (item.id ?? item.Id) === id ? detail.list : item,
          ),
        )
      } catch (error) {
        setListsMessage(
          error instanceof Error ? error.message : 'Could not open this list.',
        )
      } finally {
        setListActionLoading(false)
      }
    }

    const addBookToReadingList = async () => {
      if (!authToken || !selectedList || !bookToAdd) return

      const listId = selectedList.list.id ?? selectedList.list.Id
      if (!listId) return

      setListActionLoading(true)
      setListsMessage('')

      try {
        const response = await fetch(
          `/ReadingLists/${encodeURIComponent(listId)}/books/${encodeURIComponent(bookToAdd)}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
          },
        )

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Could not add book to list.')
        }

        setBookToAdd('')
        await openReadingList(selectedList.list)
        setShowListBookPicker(false)
        setListsMessage('Book added to the list.')
      } catch (error) {
        setListsMessage(
          error instanceof Error ? error.message : 'Could not add this book.',
        )
      } finally {
        setListActionLoading(false)
      }
    }

    const removeBookFromReadingList = async (bookId: string) => {
      if (!authToken || !selectedList) return

      const listId = selectedList.list.id ?? selectedList.list.Id
      if (!listId) return

      setListActionLoading(true)
      setListsMessage('')

      try {
        const response = await fetch(
          `/ReadingLists/${encodeURIComponent(listId)}/books/${encodeURIComponent(bookId)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` },
          },
        )

        if (!response.ok) {
          throw new Error('Could not remove book from list.')
        }

        setSelectedList((current) =>
          current
            ? {
                ...current,
                list: {
                  ...current.list,
                  bookIds: (current.list.bookIds ?? current.list.BookIds ?? [])
                    .filter((id) => id !== bookId),
                },
                books: current.books.filter(
                  (book) => (book.id ?? book.Id) !== bookId,
                ),
              }
            : null,
        )
        setReadingLists((current) =>
          current.map((list) =>
            (list.id ?? list.Id) === listId
              ? {
                  ...list,
                  bookIds: (list.bookIds ?? list.BookIds ?? [])
                    .filter((id) => id !== bookId),
                }
              : list,
          ),
        )
        setListsMessage('Book removed from the list.')
      } catch (error) {
        setListsMessage(
          error instanceof Error ? error.message : 'Could not remove this book.',
        )
      } finally {
        setListActionLoading(false)
      }
    }

    const deleteReadingList = async (list: ReadingList) => {
      if (!authToken) return

      const id = list.id ?? list.Id
      if (!id) return

      if (!window.confirm(`Delete "${list.name ?? list.Name ?? 'this list'}"?`)) {
        return
      }

      setListActionLoading(true)
      setListsMessage('')

      try {
        const response = await fetch(`/ReadingLists/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (!response.ok) {
          throw new Error('Could not delete this reading list.')
        }

        setReadingLists((current) =>
          current.filter((item) => (item.id ?? item.Id) !== id),
        )

        if ((selectedList?.list.id ?? selectedList?.list.Id) === id) {
          setSelectedList(null)
        }

        setListsMessage('Reading list deleted.')
      } catch (error) {
        setListsMessage(
          error instanceof Error ? error.message : 'Could not delete this list.',
        )
      } finally {
        setListActionLoading(false)
      }
    }

    const updateBook = async (
      book: ShelvedBook,
      changes: {
        status?: ReadingStatus
        rating?: number
        currentPage?: number
        pageCount?: number
      },
    ): Promise<boolean> => {
      const id = book.id ?? book.Id

      if (!authToken || !id) {
        setBookUpdateMessage('Could not identify this book. Refresh your library.')
        return false
      }

      setUpdatingBook(true)
      setBookUpdateMessage('')

      const title = book.title ?? book.Title ?? 'Untitled'
      const author = book.author ?? book.Author ?? 'Unknown author'
      const coverUrl = book.coverUrl ?? book.CoverUrl ?? ''

      const updatedBook = {
        title,
        author,
        coverUrl,
        description: book.description ?? book.Description ?? '',
        status: changes.status ?? book.status ?? book.Status ?? 'To read',
        rating: changes.rating ?? book.rating ?? book.Rating ?? 0,
        currentPage:
          changes.currentPage ?? book.currentPage ?? book.CurrentPage ?? 0,
        pageCount: changes.pageCount ?? book.pageCount ?? book.PageCount ?? 0,
      }

      try {
        const response = await fetch(`/Books/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updatedBook),
        })

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || `Could not update book (${response.status}).`)
        }

        setBooks((current) =>
          current.map((item) =>
            (item.id ?? item.Id) === id
              ? { ...item, ...updatedBook, id }
              : item,
          ),
        )

        setBookUpdateMessage('Book updated successfully.')
        return true
      } catch (error) {
        setBookUpdateMessage(
          error instanceof Error ? error.message : 'Could not update this book.',
        )
        return false
      } finally {
        setUpdatingBook(false)
      }
    }


    useEffect(() => {

      if (isLoggedIn && authToken && userRole === 'Reader') {
        if (
          activePage === 'Your Books' ||
          activePage === 'Home' ||
          activePage === 'Discover'
        ) {
          void loadMyBooks(authToken)
        }

        if (activePage === 'Lists') {
          void loadMyBooks(authToken)
          void loadReadingLists()
        }
      }

    }, [isLoggedIn, authToken, activePage, userRole])

    useEffect(() => {
      const shouldLoadCatalog =
        isLoggedIn &&
        authToken &&
        (userRole === 'Admin' ||
          (userRole === 'Reader' && activePage === 'Discover'))
      if (!shouldLoadCatalog || !authToken) return

      let isCurrent = true
      setCatalogLoading(true)
      setCatalogMessage('')

      const loadCatalogBookIds = async () => {
        try {
          const response = await fetch('/BookCatalog', {
            headers: { Authorization: `Bearer ${authToken}` },
          })
          const responseText = await response.text()

          if (!response.ok) {
            let message = responseText
            try {
              const parsed = JSON.parse(responseText)
              message =
                typeof parsed === 'string'
                  ? parsed
                  : parsed.message ?? parsed.title ?? responseText
            } catch {
              // Use the response text when the server doesn't return JSON.
            }
            throw new Error(
              message || `Could not check the catalog (${response.status}).`,
            )
          }

          const catalog = JSON.parse(responseText) as CatalogBook[]
          const bookIds = catalog
            .map((book) => book.externalGoogleBooksId ?? book.ExternalGoogleBooksId)
            .filter((id): id is string => Boolean(id))

          if (isCurrent) {
            setCatalogBooks(catalog)
            setCatalogGoogleBookIds(new Set(bookIds))
          }
        } catch (error) {
          if (isCurrent) {
            setCatalogMessage(
              error instanceof Error
                ? error.message
                : 'Could not check the shared catalog.',
            )
          }
        } finally {
          if (isCurrent) setCatalogLoading(false)
        }
      }

      void loadCatalogBookIds()
      return () => {
        isCurrent = false
      }
    }, [isLoggedIn, authToken, userRole, activePage, catalogRefreshKey])

    const searchBooks = async (event: FormEvent<HTMLFormElement>) => {

      event.preventDefault()

      const query = searchQuery.trim()

      if (!query || !authToken || userRole !== 'Admin') return



      setSearchLoading(true)

      setSearchMessage('')

      setSearchResults([])



      try {

        const response = await fetch(`/Books/search?q=${encodeURIComponent(query)}`, {

          headers: { Authorization: `Bearer ${authToken}` },

        })

        const responseText = await response.text()

        if (!response.ok) {

          let message = responseText

          try {

            const parsed = JSON.parse(responseText)

            message = typeof parsed === 'string' ? parsed : parsed.message ?? parsed.title ?? responseText

          } catch {

            // Use the response text when the server doesn't return JSON.

          }

          throw new Error(message || `Book search failed (${response.status}).`)

        }



        const data = JSON.parse(responseText) as { items?: GoogleBookResult[] }

        setSearchResults(data.items ?? [])

        if (!data.items?.length) setSearchMessage('No books found. Try another title or author.')

      } catch (error) {

        setSearchMessage(error instanceof Error ? error.message : 'Could not search for books. Please try again.')

      } finally {

        setSearchLoading(false)

      }

    }



    const addBookToCatalog = async (result: GoogleBookResult) => {

      if (!authToken || !result.volumeInfo?.title) return

      setAddingBookId(result.id)

      setSearchMessage('')



      try {

        const title = result.volumeInfo.title

        if (catalogGoogleBookIds.has(result.id)) {
          setSearchMessage('This book is already in the shared catalog.')
          return
        }



        const response = await fetch('/BookCatalog', {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json',

            Authorization: `Bearer ${authToken}`,

          },

          body: JSON.stringify({
            externalGoogleBooksId: result.id,
            title,
            authors: result.volumeInfo.authors ?? [],
            description: result.volumeInfo.description ?? '',
            coverImageUrl: (
              result.volumeInfo.imageLinks?.thumbnail ??
              result.volumeInfo.imageLinks?.smallThumbnail ??
              ''
            ).replace(/^http:/, 'https:'),
            publishedDate: result.volumeInfo.publishedDate ?? null,
            categories: result.volumeInfo.categories ?? [],
          }),

        })

        const responseText = await response.text()

        if (response.status === 409) {
          let message = responseText
          try {
            const parsed = JSON.parse(responseText)
            message =
              typeof parsed === 'string'
                ? parsed
                : parsed.message ?? parsed.title ?? responseText
          } catch {
            // Use the response text when the server doesn't return JSON.
          }

          setCatalogGoogleBookIds((current) => new Set(current).add(result.id))
          setAddedBookIds((current) =>
            current.includes(result.id) ? current : [...current, result.id],
          )
          setSearchMessage(
            message || 'This book is already in the shared catalog.',
          )
          return
        }

        if (!response.ok) {

          let message = responseText

          try {

            const parsed = JSON.parse(responseText)

            message = typeof parsed === 'string' ? parsed : parsed.message ?? parsed.title ?? responseText

          } catch {

            // Use the response text when the server doesn't return JSON.

          }

          throw new Error(
            message ||
              `Could not add book to catalog (${response.status}).`,
          )

        }



        setCatalogGoogleBookIds((current) => new Set(current).add(result.id))
        setAddedBookIds((current) =>
          current.includes(result.id) ? current : [...current, result.id],
        )
        const catalogBook = JSON.parse(responseText) as CatalogBook
        setCatalogBooks((current) =>
          current.some(
            (book) =>
              (book.externalGoogleBooksId ??
                book.ExternalGoogleBooksId) === result.id,
          )
            ? current
            : [...current, catalogBook],
        )
        setSearchMessage(`“${title}” was added to the shared catalog.`)

      } catch (error) {

        setSearchMessage(
          error instanceof Error
            ? error.message
            : 'Could not add this book to the shared catalog.',
        )

      } finally {

        setAddingBookId(null)

      }

    }



    const handleLoginSubmit = async (



      event: FormEvent<HTMLFormElement>,



    ) => {



      event.preventDefault()



      setLoginMessage('')



      setIsLoggingIn(true)



      try {



        const response = await fetch('/Auth/Login', {



          method: 'POST',



          headers: { 'Content-Type': 'application/json' },



          body: JSON.stringify({



            usernameOrEmail: loginEmail,



            password: loginPassword,



          }),



        })



        const responseText = await response.text()



        if (!response.ok) {



          let message = responseText



          try {



            const parsed = JSON.parse(responseText)



            message =



              typeof parsed === 'string'



                ? parsed



                : parsed.title ?? parsed.message ?? responseText



          } catch {



            // Keep the original response text.



          }



          throw new Error(



            message || `Login failed (${response.status}).`,



          )



        }



            const loginData = JSON.parse(responseText) as {
              token: string
              user: {
                username: string
                email: string
                role: string
                readingGoal?: number
                ReadingGoal?: number
              }
            }



        
          if (!loginData.token) {
            throw new Error('Login succeeded, but the server did not return a token.')
          }
          setAuthToken(loginData.token)


          setProfileUsername(loginData.user.username)
          setUserRole(loginData.user.role === 'Admin' ? 'Admin' : 'Reader')

          setProfileEmail(loginData.user.email)
          setReadingGoal(loginData.user.readingGoal ?? loginData.user.ReadingGoal ?? 12)

          setIsLoggedIn(true)

          setLoginPassword('')

          setLoginMessage('')






      } catch (error) {



        setLoginMessage(



          error instanceof Error



            ? error.message



            : 'Could not connect to the server. Please try again.',



        )



      } finally {



        setIsLoggingIn(false)



      }



    }

    const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!authToken) {
        setProfileMessage('Please log in again.')
        return
      }

      setIsSavingProfile(true)
      setProfileMessage('')

      try {
        const response = await fetch('/Auth/UpdateAccount', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            username: profileUsername.trim(),
            email: profileEmail.trim(),
            password: profilePassword || null,
            readingGoal,
          }),
        })

        const responseText = await response.text()

        if (!response.ok) {
          let message = responseText
          try {
            const parsed = JSON.parse(responseText)
            message =
              typeof parsed === 'string'
                ? parsed
                : parsed.message ?? parsed.title ?? responseText
          } catch {
            // Keep the server response text.
          }

          throw new Error(message || `Save failed (${response.status}).`)
        }

        const saved = JSON.parse(responseText) as {
          username: string
          email: string
          readingGoal?: number
        }

        setProfileUsername(saved.username)
        setProfileEmail(saved.email)
        setReadingGoal(saved.readingGoal ?? readingGoal)
        setProfilePassword('')
        setProfileMessage('Profile changes saved successfully.')
      } catch (error) {
        setProfileMessage(
          error instanceof Error
            ? error.message
            : 'Could not save profile changes.',
        )
      } finally {
        setIsSavingProfile(false)
      }
    }

    const deleteAccount = async () => {
      if (!authToken) {
        setLoginMessage('Please log in again before deleting your account.');
        return;
      }

      const confirmed = window.confirm(
        'Permanently delete your Shelved account and all your saved books? This cannot be undone.'
      );

      if (!confirmed) return;

      try {
        const response = await fetch('/Auth/DeleteAccount', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Deletion failed (${response.status}).`);
        }

        // Clear the local session after successful deletion.
        setAuthToken(null);
        setIsLoggedIn(false);
        setUserRole('Reader');
        setProfileUsername('');
        setProfileEmail('');
        setBooks([]);
        setSearchResults([]);
        setAddedBookIds([]);
        setCatalogGoogleBookIds(new Set());
        setCatalogBooks([]);
        setCatalogMessage('');
        setActivePage('Home');
        setLoginMessage('Your account and saved books have been deleted.');
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : 'Could not delete your account. Please try again.'
        );
      }
    };

    const handleLogout = () => {
      setIsLoggedIn(false)
      setAuthToken(null)
      setUserRole('Reader')
      setProfileUsername('')
      setProfileEmail('')
      setBooks([])
      setBooksMessage('')
      setAddingCatalogBookId(null)
      setCatalogBookAddMessages({})
      setSearchResults([])
      setSearchQuery('')
      setAddedBookIds([])
      setSearchMessage('')
      setCatalogGoogleBookIds(new Set())
      setCatalogBooks([])
      setCatalogMessage('')
      setCatalogDeleteMessage('')
      setCatalogDeleteFailed(false)
      setCatalogEditMessage('')
      setCatalogEditFailed(false)
      setEditingCatalogBookId(null)
      setAdminUsers([])
      setAdminUsersLoadFailed(false)
      setAdminUsersMessage('')
      setAdminUsersFailed(false)
      setAdminUserSearch('')
      setAdminRoleFilter('All')
      setSelectedAdminUser(null)
      setAdminUserProfileLoading(false)
      setAdminUserActionId(null)
      setAdminSection('dashboard')
      setIsRegistering(false)
      setLoginEmail('')
      setLoginPassword('')
      setLoginMessage('')
      setActivePage('Home')
    }

    const deleteCatalogBook = async (book: CatalogBook) => {
      const id = book.id ?? book.Id
      if (!authToken || !id || userRole !== 'Admin') return

      const title = book.title ?? book.Title ?? 'this book'
      if (
        !window.confirm(
          `Remove “${title}” from the shared book catalog? This will not affect anyone's personal library.`,
        )
      ) {
        return
      }

      setCatalogActionBookId(id)
      setCatalogDeleteMessage('')
      setCatalogDeleteFailed(false)

      try {
        const response = await fetch(
          `/BookCatalog/${encodeURIComponent(id)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` },
          },
        )
        if (!response.ok) {
          const responseText = await response.text()
          let message = responseText
          try {
            const parsed = JSON.parse(responseText)
            message =
              typeof parsed === 'string'
                ? parsed
                : parsed.message ?? parsed.title ?? responseText
          } catch {
            // Use the response text when the server doesn't return JSON.
          }
          throw new Error(
            message || `Could not remove book (${response.status}).`,
          )
        }

        const externalId =
          book.externalGoogleBooksId ?? book.ExternalGoogleBooksId
        setCatalogBooks((current) =>
          current.filter((item) => (item.id ?? item.Id) !== id),
        )
        if (externalId) {
          setCatalogGoogleBookIds((current) => {
            const updated = new Set(current)
            updated.delete(externalId)
            return updated
          })
          setAddedBookIds((current) =>
            current.filter((addedId) => addedId !== externalId),
          )
        }
        setCatalogDeleteMessage(`“${title}” was removed from the catalog.`)
      } catch (error) {
        setCatalogDeleteFailed(true)
        setCatalogDeleteMessage(
          error instanceof Error
            ? error.message
            : 'Could not remove this book from the catalog.',
        )
      } finally {
        setCatalogActionBookId(null)
      }
    }

    const startCatalogBookEdit = (book: CatalogBook) => {
      setEditingCatalogBookId(book.id ?? book.Id ?? null)
      setCatalogEditDraft({
        title: book.title ?? book.Title ?? '',
        authors: (book.authors ?? book.Authors ?? []).join(', '),
        description: book.description ?? book.Description ?? '',
        coverImageUrl: book.coverImageUrl ?? book.CoverImageUrl ?? '',
        publishedDate: book.publishedDate ?? book.PublishedDate ?? '',
        categories: (book.categories ?? book.Categories ?? []).join(', '),
      })
      setCatalogEditMessage('')
      setCatalogEditFailed(false)
    }

    const updateCatalogBook = async (
      event: FormEvent<HTMLFormElement>,
      book: CatalogBook,
    ) => {
      event.preventDefault()
      const id = book.id ?? book.Id
      if (!authToken || !id || userRole !== 'Admin') return

      if (!catalogEditDraft.title.trim()) {
        setCatalogEditFailed(true)
        setCatalogEditMessage('Book title is required.')
        return
      }

      setCatalogActionBookId(id)
      setCatalogEditMessage('')
      setCatalogEditFailed(false)

      try {
        const response = await fetch(
          `/BookCatalog/${encodeURIComponent(id)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              externalGoogleBooksId:
                book.externalGoogleBooksId ??
                book.ExternalGoogleBooksId ??
                null,
              title: catalogEditDraft.title,
              authors: catalogEditDraft.authors
                .split(',')
                .map((author) => author.trim())
                .filter(Boolean),
              description: catalogEditDraft.description,
              coverImageUrl: catalogEditDraft.coverImageUrl,
              publishedDate: catalogEditDraft.publishedDate || null,
              categories: catalogEditDraft.categories
                .split(',')
                .map((category) => category.trim())
                .filter(Boolean),
            }),
          },
        )

        const responseText = await response.text()
        if (!response.ok) {
          let message = responseText
          try {
            const parsed = JSON.parse(responseText)
            message =
              typeof parsed === 'string'
                ? parsed
                : parsed.message ?? parsed.title ?? responseText
          } catch {
            // Use the response text when the server doesn't return JSON.
          }
          throw new Error(
            message || `Could not update book (${response.status}).`,
          )
        }

        const updatedBook = JSON.parse(responseText) as CatalogBook
        setCatalogBooks((current) =>
          current.map((item) =>
            (item.id ?? item.Id) === id ? updatedBook : item,
          ),
        )
        setEditingCatalogBookId(null)
        setCatalogEditMessage('Catalog entry updated.')
      } catch (error) {
        setCatalogEditFailed(true)
        setCatalogEditMessage(
          error instanceof Error
            ? error.message
            : 'Could not update this catalog entry.',
        )
      } finally {
        setCatalogActionBookId(null)
      }
    }

    const getAdminApiError = async (
      response: Response,
      fallback: string,
    ) => {
      const text = await response.text()
      if (!text) return fallback
      try {
        const parsed = JSON.parse(text)
        return typeof parsed === 'string'
          ? parsed
          : parsed.message ?? parsed.title ?? fallback
      } catch {
        return `The server returned a non-JSON response (${response.status}). Check the API route and Vite proxy configuration.`
      }
    }

    const getAdminApiJson = async <T,>(
      response: Response,
      fallback: string,
    ): Promise<T> => {
      const text = await response.text()
      if (!response.ok) {
        let message = fallback
        try {
          const parsed = JSON.parse(text)
          message =
            typeof parsed === 'string'
              ? parsed
              : parsed.message ?? parsed.title ?? fallback
        } catch {
          message = `The server returned a non-JSON response (${response.status}). Check the API route and Vite proxy configuration.`
        }
        throw new Error(message)
      }

      try {
        return JSON.parse(text) as T
      } catch {
        throw new Error(
          `The server returned an unexpected non-JSON response (${response.status}). Check the API route and Vite proxy configuration.`,
        )
      }
    }

    const loadAdminUsers = async () => {
      if (!authToken || userRole !== 'Admin') return

      setAdminUsersLoading(true)
      setAdminUsersLoadFailed(false)
      setAdminUsersMessage('')
      setAdminUsersFailed(false)
      setSelectedAdminUser(null)
      try {
        const response = await fetch('/AdminUsers', {
          headers: { Authorization: 'Bearer ' + authToken },
        })
        setAdminUsers(
          await getAdminApiJson<AdminUserSummary[]>(
            response,
            'Could not load users.',
          ),
        )
      } catch (error) {
        setAdminUsersLoadFailed(true)
        setAdminUsersFailed(true)
        setAdminUsersMessage(
          error instanceof Error ? error.message : 'Could not load users.',
        )
      } finally {
        setAdminUsersLoading(false)
      }
    }

    const openAdminUser = async (user: AdminUserSummary) => {
      if (!authToken || userRole !== 'Admin') return

      setAdminUserProfileLoading(true)
      setSelectedAdminUser(null)
      setAdminUsersMessage('')
      setAdminUsersFailed(false)
      try {
        const response = await fetch(
          `/AdminUsers/${encodeURIComponent(user.accountId)}`,
          { headers: { Authorization: 'Bearer ' + authToken } },
        )
        const profile = await getAdminApiJson<Partial<AdminUserProfile>>(
          response,
          'Could not load this profile.',
        )
        setSelectedAdminUser({ ...user, ...profile } as AdminUserProfile)
      } catch (error) {
        setAdminUsersFailed(true)
        setAdminUsersMessage(
          error instanceof Error
            ? error.message
            : 'Could not load this profile.',
        )
      } finally {
        setAdminUserProfileLoading(false)
      }
    }

    const updateAdminUserRole = async (user: AdminUserSummary) => {
      if (!authToken || userRole !== 'Admin') return
      const nextRole = user.role === 'Admin' ? 'Reader' : 'Admin'
      if (
        !window.confirm(
          `Change ${user.username} (${user.email}) from ${user.role} to ${nextRole}?`,
        )
      ) {
        return
      }

      setAdminUserActionId(user.accountId)
      setAdminUsersMessage('')
      setAdminUsersFailed(false)
      try {
        const response = await fetch(
          `/AdminUsers/${encodeURIComponent(user.accountId)}/role`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + authToken,
            },
            body: JSON.stringify({ role: nextRole }),
          },
        )
        if (!response.ok) {
          throw new Error(
            await getAdminApiError(response, 'Could not change this role.'),
          )
        }

        setAdminUsers((current) =>
          current.map((item) =>
            item.accountId === user.accountId
              ? { ...item, role: nextRole }
              : item,
          ),
        )
        setSelectedAdminUser((current) =>
          current?.accountId === user.accountId
            ? { ...current, role: nextRole }
            : current,
        )
        setAdminUsersMessage(
          `${user.username} is now ${nextRole}.`,
        )
      } catch (error) {
        setAdminUsersFailed(true)
        setAdminUsersMessage(
          error instanceof Error
            ? error.message
            : 'Could not change this role.',
        )
      } finally {
        setAdminUserActionId(null)
      }
    }

    const deleteAdminUser = async (user: AdminUserSummary) => {
      if (!authToken || userRole !== 'Admin') return
      if (
        !window.confirm(
          `Permanently delete ${user.username} (${user.email})? This removes the account, its personal books, and its reading lists. Shared catalog books and other users' data will not be deleted. This cannot be undone.`,
        )
      ) {
        return
      }

      setAdminUserActionId(user.accountId)
      setAdminUsersMessage('')
      setAdminUsersFailed(false)
      try {
        const response = await fetch(
          `/AdminUsers/${encodeURIComponent(user.accountId)}`,
          {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + authToken },
          },
        )
        if (!response.ok) {
          throw new Error(
            await getAdminApiError(response, 'Could not delete this account.'),
          )
        }

        setAdminUsers((current) =>
          current.filter((item) => item.accountId !== user.accountId),
        )
        setSelectedAdminUser(null)
        setAdminUsersMessage(
          `${user.username}'s account, personal books, and reading lists were deleted. Shared catalog books were not affected.`,
        )
      } catch (error) {
        setAdminUsersFailed(true)
        setAdminUsersMessage(
          error instanceof Error
            ? error.message
            : 'Could not delete this account.',
        )
      } finally {
        setAdminUserActionId(null)
      }
    }

    const visibleAdminUsers = adminUsers.filter((user) => {
      const search = adminUserSearch.trim().toLocaleLowerCase()
      const matchesSearch =
        !search ||
        user.username.toLocaleLowerCase().includes(search) ||
        user.email.toLocaleLowerCase().includes(search)
      return (
        matchesSearch &&
        (adminRoleFilter === 'All' || user.role === adminRoleFilter)
      )
    })

    if (isLoggedIn && userRole === 'Admin') {
      return (
        <main className="admin-dashboard">
          <header className="admin-dashboard-header">
            <div className="admin-dashboard-brand">Shelved</div>
            <div className="admin-dashboard-header-actions">
              {adminSection !== 'dashboard' && (
                <button
                  type="button"
                  className="admin-dashboard-back"
                  onClick={() => {
                    setCatalogDeleteMessage('')
                    setCatalogDeleteFailed(false)
                    setAdminSection('dashboard')
                    setSelectedAdminUser(null)
                    setAdminUsersMessage('')
                  }}
                >
                  Back to dashboard
                </button>
              )}
              <button
                type="button"
                className="admin-dashboard-logout"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </header>

          <section className="admin-dashboard-content">
            {adminSection === 'catalog' ? (
              <>
                <p className="admin-dashboard-eyebrow">SHARED LIBRARY</p>
                <h1>Book Catalog</h1>
                <p className="admin-dashboard-welcome">
                  View and manage books available in Shelved’s shared catalog.
                </p>

                {catalogDeleteMessage && (
                  <p
                    className={
                      catalogDeleteFailed
                        ? 'admin-catalog-error'
                        : 'admin-catalog-success'
                    }
                    role={catalogDeleteFailed ? 'alert' : 'status'}
                  >
                    {catalogDeleteMessage}
                  </p>
                )}
                {catalogEditMessage && (
                  <p
                    className={
                      catalogEditFailed
                        ? 'admin-catalog-error'
                        : 'admin-catalog-success'
                    }
                    role={catalogEditFailed ? 'alert' : 'status'}
                  >
                    {catalogEditMessage}
                  </p>
                )}

                {catalogLoading ? (
                  <p className="admin-catalog-state" role="status">
                    Loading the shared catalog...
                  </p>
                ) : catalogMessage ? (
                  <div className="admin-catalog-state admin-catalog-error">
                    <p>{catalogMessage}</p>
                    <button
                      type="button"
                      className="admin-catalog-retry"
                      onClick={() => {
                        setCatalogMessage('')
                        setCatalogDeleteFailed(false)
                        setCatalogRefreshKey((current) => current + 1)
                      }}
                    >
                      Try again
                    </button>
                  </div>
                ) : catalogBooks.length === 0 ? (
                  <div className="admin-catalog-state">
                    <h2>The shared catalog is empty.</h2>
                    <p>
                      Use Google Books Search on the dashboard to add the first
                      catalog entries.
                    </p>
                  </div>
                ) : (
                  <div className="admin-catalog-grid">
                    {catalogBooks.map((book, index) => {
                      const id =
                        book.id ?? book.Id ?? `${book.title}-${index}`
                      const title = book.title ?? book.Title ?? 'Untitled'
                      const authors = book.authors ?? book.Authors ?? []
                      const cover =
                        book.coverImageUrl ?? book.CoverImageUrl ?? ''
                      const publishedDate =
                        book.publishedDate ?? book.PublishedDate ?? ''
                      const publishedYear =
                        publishedDate.match(/^\d{4}/)?.[0]
                      const busy = catalogActionBookId === id

                      return (
                        <article className="admin-catalog-book" key={id}>
                          {cover ? (
                            <img
                              className="admin-catalog-book-cover"
                              src={cover.replace(/^http:/, 'https:')}
                              alt={`Cover of ${title}`}
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="admin-catalog-book-cover-placeholder"
                              aria-label="No cover available"
                            >
                              {'\u25A4'}
                            </div>
                          )}
                          {editingCatalogBookId === (book.id ?? book.Id) ? (
                            <form
                              className="admin-catalog-edit-form"
                              onSubmit={(event) =>
                                void updateCatalogBook(event, book)
                              }
                            >
                              <label>
                                Title
                                <input
                                  value={catalogEditDraft.title}
                                  onChange={(event) =>
                                    setCatalogEditDraft((current) => ({
                                      ...current,
                                      title: event.target.value,
                                    }))
                                  }
                                  required
                                />
                              </label>
                              <label>
                                Authors (comma-separated)
                                <input
                                  value={catalogEditDraft.authors}
                                  onChange={(event) =>
                                    setCatalogEditDraft((current) => ({
                                      ...current,
                                      authors: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                Cover image URL
                                <input
                                  type="url"
                                  value={catalogEditDraft.coverImageUrl}
                                  onChange={(event) =>
                                    setCatalogEditDraft((current) => ({
                                      ...current,
                                      coverImageUrl: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                Published date
                                <input
                                  value={catalogEditDraft.publishedDate}
                                  onChange={(event) =>
                                    setCatalogEditDraft((current) => ({
                                      ...current,
                                      publishedDate: event.target.value,
                                    }))
                                  }
                                  placeholder="e.g. 2024"
                                />
                              </label>
                              <label>
                                Categories (comma-separated)
                                <input
                                  value={catalogEditDraft.categories}
                                  onChange={(event) =>
                                    setCatalogEditDraft((current) => ({
                                      ...current,
                                      categories: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                Description
                                <textarea
                                  value={catalogEditDraft.description}
                                  onChange={(event) =>
                                    setCatalogEditDraft((current) => ({
                                      ...current,
                                      description: event.target.value,
                                    }))
                                  }
                                  rows={4}
                                />
                              </label>
                              <div className="admin-catalog-edit-actions">
                                <button
                                  type="submit"
                                  className="admin-catalog-edit-save"
                                  disabled={busy}
                                >
                                  {busy ? 'Saving...' : 'Save changes'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-catalog-edit-cancel"
                                  onClick={() => {
                                    setEditingCatalogBookId(null)
                                    setCatalogEditMessage('')
                                    setCatalogEditFailed(false)
                                  }}
                                  disabled={busy}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="admin-catalog-book-details">
                                <h2>{title}</h2>
                                <p>
                                  {authors.length
                                    ? authors.join(', ')
                                    : 'Unknown author'}
                                </p>
                                {publishedYear && (
                                  <span>Published {publishedYear}</span>
                                )}
                              </div>
                              <div className="admin-catalog-book-actions">
                                <button
                                  type="button"
                                  className="admin-catalog-edit-button"
                                  onClick={() => startCatalogBookEdit(book)}
                                  disabled={busy}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="admin-catalog-delete"
                                  onClick={() => void deleteCatalogBook(book)}
                                  disabled={busy}
                                >
                                  {busy ? 'Removing...' : 'Remove from catalog'}
                                </button>
                              </div>
                            </>
                          )}
                        </article>
                      )
                    })}
                  </div>
                )}
              </>
            ) : adminSection === 'users' ? (
                            <>
                              <p className="admin-dashboard-eyebrow">SHELVED ACCOUNTS</p>
                              <h1>
                                {selectedAdminUser ? 'User Profile' : 'User Management'}
                              </h1>
                              <p className="admin-dashboard-welcome">
                                {selectedAdminUser
                                  ? `Account details and private library for ${selectedAdminUser.username}.`
                                  : 'Review accounts, roles, and personal library activity.'}
                              </p>

                              {adminUsersMessage && (
                                <p
                                  className={
                                    adminUsersFailed
                                      ? 'admin-user-message admin-user-message-error'
                                      : 'admin-user-message'
                                  }
                                  role={adminUsersFailed ? 'alert' : 'status'}
                                >
                                  {adminUsersMessage}
                                </p>
                              )}

                              {adminUserProfileLoading ? (
                                <div className="admin-user-state" role="status">
                                  Loading user profile...
                                </div>
                              ) : selectedAdminUser ? (
                                <section className="admin-user-profile">
                                  <button
                                    type="button"
                                    className="admin-dashboard-back admin-user-return"
                                    onClick={() => {
                                      setSelectedAdminUser(null)
                                      setAdminUsersMessage('')
                                      setAdminUsersFailed(false)
                                    }}
                                  >
                                    Back to users
                                  </button>
                                  <div className="admin-user-profile-heading">
                                    <div>
                                      <h2>{selectedAdminUser.username}</h2>
                                      <p>{selectedAdminUser.email}</p>
                                    </div>
                                    <span className={`admin-user-role admin-user-role-${selectedAdminUser.role.toLowerCase()}`}>
                                      {selectedAdminUser.role}
                                    </span>
                                  </div>
                                  <dl className="admin-user-account-meta">
                                    <div>
                                      <dt>Account ID</dt>
                                      <dd>{selectedAdminUser.accountId}</dd>
                                    </div>
                                    {selectedAdminUser.registrationDate && (
                                      <div>
                                        <dt>Registered</dt>
                                        <dd>
                                          {new Date(
                                            selectedAdminUser.registrationDate,
                                          ).toLocaleDateString()}
                                        </dd>
                                      </div>
                                    )}
                                    <div>
                                      <dt>Personal books</dt>
                                      <dd>{selectedAdminUser.personalBookCount}</dd>
                                    </div>
                                    <div>
                                      <dt>Reading lists</dt>
                                      <dd>{selectedAdminUser.readingListCount}</dd>
                                    </div>
                                  </dl>
                                  <div className="admin-user-actions">
                                    <button
                                      type="button"
                                      className="admin-user-role-button"
                                      onClick={() =>
                                        void updateAdminUserRole(selectedAdminUser)
                                      }
                                      disabled={
                                        adminUserActionId === selectedAdminUser.accountId
                                      }
                                    >
                                      Change to{' '}
                                      {selectedAdminUser.role === 'Admin'
                                        ? 'Reader'
                                        : 'Admin'}
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-user-delete-button"
                                      onClick={() => void deleteAdminUser(selectedAdminUser)}
                                      disabled={
                                        adminUserActionId === selectedAdminUser.accountId ||
                                        selectedAdminUser.email.toLowerCase() ===
                                          profileEmail.toLowerCase()
                                      }
                                      title={
                                        selectedAdminUser.email.toLowerCase() ===
                                        profileEmail.toLowerCase()
                                          ? 'You cannot delete your own account here.'
                                          : undefined
                                      }
                                    >
                                      Delete account
                                    </button>
                                  </div>

                                  <section className="admin-user-data-section">
                                    <div className="admin-user-section-heading">
                                      <h2>Personal Books</h2>
                                      <span>{selectedAdminUser.personalBooks.length}</span>
                                    </div>
                                    {selectedAdminUser.personalBooks.length === 0 ? (
                                      <p className="admin-user-state">
                                        This account has no personal books.
                                      </p>
                                    ) : (
                                      <div className="admin-user-book-list">
                                        {selectedAdminUser.personalBooks.map((book) => {
                                          const id = book.id ?? book.Id ?? book.title ?? ''
                                          const title = book.title ?? book.Title ?? 'Untitled'
                                          const author =
                                            book.author ?? book.Author ?? 'Unknown author'
                                          const status = book.status ?? book.Status ?? 'To read'
                                          const currentPage =
                                            book.currentPage ?? book.CurrentPage ?? 0
                                          const pageCount =
                                            book.pageCount ?? book.PageCount ?? 0
                                          const cover = book.coverUrl ?? book.CoverUrl

                                          return (
                                            <article className="admin-user-book" key={id}>
                                              {cover ? (
                                                <img src={cover} alt="" loading="lazy" />
                                              ) : (
                                                <div className="admin-user-book-cover">
                                                  No cover
                                                </div>
                                              )}
                                              <div>
                                                <h3>{title}</h3>
                                                <p>{author}</p>
                                                <span>{status}</span>
                                                {pageCount > 0 && (
                                                  <span>
                                                    {currentPage} of {pageCount} pages
                                                  </span>
                                                )}
                                              </div>
                                            </article>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </section>

                                  <section className="admin-user-data-section">
                                    <div className="admin-user-section-heading">
                                      <h2>Reading Lists</h2>
                                      <span>{selectedAdminUser.readingLists.length}</span>
                                    </div>
                                    {selectedAdminUser.readingLists.length === 0 ? (
                                      <p className="admin-user-state">
                                        This account has no reading lists.
                                      </p>
                                    ) : (
                                      <div className="admin-user-list-grid">
                                        {selectedAdminUser.readingLists.map((list) => (
                                          <article
                                            className="admin-user-reading-list"
                                            key={list.id ?? list.Id ?? list.name}
                                          >
                                            <h3>{list.name ?? list.Name ?? 'Untitled list'}</h3>
                                            <p>
                                              {list.description ??
                                                list.Description ??
                                                'No description'}
                                            </p>
                                            <span>
                                              {list.books?.length ?? 0}{' '}
                                              {(list.books?.length ?? 0) === 1
                                                ? 'book'
                                                : 'books'}
                                              {list.isShared ?? list.IsShared
                                                ? ' · Shared'
                                                : ''}
                                            </span>
                                            {!!list.books?.length && (
                                              <ul>
                                                {list.books.map((book) => (
                                                  <li key={book.id}>{book.title}</li>
                                                ))}
                                              </ul>
                                            )}
                                          </article>
                                        ))}
                                      </div>
                                    )}
                                  </section>
                                </section>
                              ) : adminUsersLoading ? (
                                <div className="admin-user-state" role="status">
                                  Loading registered users...
                                </div>
                              ) : adminUsersLoadFailed ? (
                                <div className="admin-user-state admin-user-message-error">
                                  <p>{adminUsersMessage}</p>
                                  <button
                                    type="button"
                                    className="admin-user-role-button"
                                    onClick={() => void loadAdminUsers()}
                                  >
                                    Try again
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="admin-user-filters">
                                    <label>
                                      <span>Search username or email</span>
                                      <input
                                        type="search"
                                        value={adminUserSearch}
                                        onChange={(event) =>
                                          setAdminUserSearch(event.target.value)
                                        }
                                        placeholder="Search accounts"
                                      />
                                    </label>
                                    <label>
                                      <span>Filter by role</span>
                                      <select
                                        value={adminRoleFilter}
                                        onChange={(event) =>
                                          setAdminRoleFilter(
                                            event.target.value as
                                              | 'All'
                                              | 'Reader'
                                              | 'Admin',
                                          )
                                        }
                                      >
                                        <option value="All">All roles</option>
                                        <option value="Reader">Reader</option>
                                        <option value="Admin">Admin</option>
                                      </select>
                                    </label>
                                    <span className="admin-user-result-count">
                                      {visibleAdminUsers.length} of {adminUsers.length} users
                                    </span>
                                  </div>
                                  {adminUsers.length === 0 ? (
                                    <div className="admin-user-state">
                                      No registered users were found.
                                    </div>
                                  ) : visibleAdminUsers.length === 0 ? (
                                    <div className="admin-user-state">
                                      No users match these search and role filters.
                                    </div>
                                  ) : (
                                    <div className="admin-user-grid">
                                      {visibleAdminUsers.map((user) => {
                                        const isSelf =
                                          user.email.toLowerCase() ===
                                          profileEmail.toLowerCase()
                                        const isBusy = adminUserActionId === user.accountId
                                        return (
                                          <article
                                            className="admin-user-card"
                                            key={user.accountId}
                                          >
                                            <div className="admin-user-card-heading">
                                              <div>
                                                <h2>{user.username}</h2>
                                                <p>{user.email}</p>
                                              </div>
                                              <span
                                                className={`admin-user-role admin-user-role-${user.role.toLowerCase()}`}
                                              >
                                                {user.role}
                                              </span>
                                            </div>
                                            <p className="admin-user-id">
                                              Account ID: <code>{user.accountId}</code>
                                            </p>
                                            {user.registrationDate && (
                                              <p className="admin-user-date">
                                                Registered{' '}
                                                {new Date(
                                                  user.registrationDate,
                                                ).toLocaleDateString()}
                                              </p>
                                            )}
                                            <div className="admin-user-counts">
                                              <span>
                                                <strong>{user.personalBookCount}</strong>{' '}
                                                personal books
                                              </span>
                                              <span>
                                                <strong>{user.readingListCount}</strong>{' '}
                                                reading lists
                                              </span>
                                            </div>
                                            <div className="admin-user-card-actions">
                                              <button
                                                type="button"
                                                className="admin-user-role-button"
                                                onClick={() =>
                                                  void updateAdminUserRole(user)
                                                }
                                                disabled={isBusy}
                                              >
                                                Make {user.role === 'Admin' ? 'Reader' : 'Admin'}
                                              </button>
                                              <button
                                                type="button"
                                                className="admin-user-view-button"
                                                onClick={() => void openAdminUser(user)}
                                              >
                                                View profile
                                              </button>
                                              <button
                                                type="button"
                                                className="admin-user-delete-button"
                                                onClick={() => void deleteAdminUser(user)}
                                                disabled={isBusy || isSelf}
                                                title={
                                                  isSelf
                                                    ? 'You cannot delete your own account here.'
                                                    : undefined
                                                }
                                              >
                                                Delete
                                              </button>
                                            </div>
                                            {isSelf && (
                                              <span className="admin-user-self-label">
                                                Your account
                                              </span>
                                            )}
                                          </article>
                                        )
                                      })}
                                    </div>
                                  )}
                                </>
                              )}
                            </>
            ) : (
              <>
            <p className="admin-dashboard-eyebrow">SHELVED ADMINISTRATION</p>
            <h1>Admin Dashboard</h1>
            <p className="admin-dashboard-welcome">
              Welcome{profileUsername ? `, ${profileUsername}` : ''}. Choose an area to manage.
            </p>

            <div className="admin-dashboard-cards">
              <button
                type="button"
                className="admin-dashboard-card"
                onClick={() => {
                  setCatalogDeleteMessage('')
                  setCatalogDeleteFailed(false)
                  setCatalogEditMessage('')
                  setCatalogEditFailed(false)
                  setAdminSection('catalog')
                }}
              >
                <span className="admin-dashboard-card-icon" aria-hidden="true">
                  {'\u25A4'}
                </span>
                <span className="admin-dashboard-card-title">Book Catalog</span>
                <span className="admin-dashboard-card-description">
                  Manage the shared book catalog.
                </span>
                <span className="admin-dashboard-card-status">Manage catalog</span>
              </button>

              <section className="admin-google-books-panel">
                <div className="admin-google-books-heading">
                  <div>
                    <span className="admin-dashboard-eyebrow">
                      SHARED CATALOG
                    </span>
                    <h2>Google Books Search</h2>
                    <p>
                      Find books by title or author and add them to Shelved’s
                      shared catalog.
                    </p>
                  </div>
                </div>

                <form
                  className="admin-google-books-form"
                  onSubmit={searchBooks}
                >
                  <label htmlFor="admin-google-books-query">
                    Search by title or author
                  </label>
                  <div className="admin-google-books-search-row">
                    <input
                      id="admin-google-books-query"
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="e.g. The Secret History or Donna Tartt"
                    />
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={searchLoading || !searchQuery.trim()}
                    >
                      {searchLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </form>

                {catalogLoading && (
                  <p className="admin-google-books-note" role="status">
                    Checking the shared catalog...
                  </p>
                )}
                {catalogMessage && (
                  <p className="admin-google-books-error" role="alert">
                    {catalogMessage}
                  </p>
                )}
                {searchMessage && (
                  <p className="admin-google-books-message" role="status">
                    {searchMessage}
                  </p>
                )}

                {searchResults.length > 0 && (
                  <div className="admin-google-books-results">
                    {searchResults.map((result) => {
                      const info = result.volumeInfo ?? {}
                      const title = info.title ?? 'Untitled'
                      const author =
                        info.authors?.join(', ') ?? 'Unknown author'
                      const cover = (
                        info.imageLinks?.thumbnail ??
                        info.imageLinks?.smallThumbnail
                      )?.replace(/^http:/, 'https:')
                      const added =
                        catalogGoogleBookIds.has(result.id) ||
                        addedBookIds.includes(result.id)
                      const publishedYear =
                        info.publishedDate?.match(/^\d{4}/)?.[0]

                      return (
                        <article
                          className="admin-google-books-result"
                          key={result.id}
                        >
                          {cover ? (
                            <img
                              className="admin-google-books-cover"
                              src={cover}
                              alt={`Cover of ${title}`}
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="admin-google-books-cover-placeholder"
                              aria-label="No cover available"
                            >
                              Cover unavailable
                            </div>
                          )}
                          <div className="admin-google-books-result-details">
                            <h3>{title}</h3>
                            <p>{author}</p>
                            {publishedYear && (
                              <span>Published {publishedYear}</span>
                            )}
                          </div>
                          <button
                            className="admin-google-books-add-button"
                            type="button"
                            onClick={() => void addBookToCatalog(result)}
                            disabled={
                              added ||
                              catalogLoading ||
                              addingBookId === result.id ||
                              !info.title
                            }
                          >
                            {added
                              ? 'Already in catalog'
                              : addingBookId === result.id
                                ? 'Adding...'
                                : 'Add to catalog'}
                          </button>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>

              <button
                type="button"
                className="admin-dashboard-card"
                onClick={() => {
                  setAdminSection('users')
                  setAdminUserSearch('')
                  setAdminRoleFilter('All')
                  void loadAdminUsers()
                }}
              >
                <span className="admin-dashboard-card-icon" aria-hidden="true">
                  {'\u2637'}
                </span>
                <span className="admin-dashboard-card-title">User Management</span>
                <span className="admin-dashboard-card-description">
                  Manage Shelved user accounts.
                </span>
                <span className="admin-dashboard-card-status">Manage users</span>
              </button>
            </div>
              </>
            )}
          </section>
        </main>
      )
    }

    if (isLoggedIn)



    {



      
  const menuItems = [
    { name: 'Home', icon: '\u2302' },
    { name: 'Your Books', icon: '\u25A4' },
    { name: 'Discover', icon: '\u2022' },
    { name: 'Lists', icon: '\u2637' },
    { name: 'Profile', icon: '\u2661' },
  ]




      const displayName = profileUsername || loginEmail



      const initials = displayName



        .split(/[ .**\\\\\\\_**-]+/)



        .filter(Boolean)



        .slice(0, 2)



        .map((part) => part[0].toUpperCase())



        .join('')



      return (



        <main className="shelved-layout">



          <aside className="sidebar">



            <div className="sidebar-brand">



              <span className="sidebar-logo" aria-hidden="true">{'\u21AA'}</span>



              <span>Shelved</span>



            </div>



            <nav className="sidebar-nav" aria-label="Main navigation">



              {menuItems.map((item) => (



                <button



                  key={item.name}



                  type="button"



                  className={`nav-item ${



                    activePage === item.name ? 'active' : ''



                  }`}



                  onClick={() => setActivePage(item.name)}



                  aria-current={activePage === item.name ? 'page' : undefined}



                >



                  <span className="nav-icon" aria-hidden="true">



                    {item.icon}



                  </span>



                  <span>{item.name}</span>



                </button>



              ))}



            </nav>



            <div className="sidebar-bottom">



              <button



                type="button"



                className="logout-button"



                onClick={handleLogout}



              >



                <span className="nav-icon" aria-hidden="true">{'\u21AA'}</span>



                <span>Log out</span>



              </button>



              <div className="sidebar-profile">
                <div className="avatar">{initials || 'U'}</div>
                <div className="profile-details">
                  <strong>{displayName}</strong>
                  <span>{loginEmail}</span>
                </div>
              </div>
            </div>
          </aside>
          <section className="workspace">
            <header className="workspace-header">
              <div className="header-spacer" />
              <button
                type="button"
                className="top-avatar"
                aria-label="Open profile"
                onClick={() => setActivePage('Profile')}
              >
                {initials || 'U'}



              </button>



            </header>



            <main className="workspace-content">









              
              {activePage !== 'Home' && activePage !== 'Lists' && (
                <p className="workspace-description">
                  {activePage === 'Your Books'
                    ? 'Your personal library will live here.'
                    : activePage === 'Discover'
                      ? 'Find your next favourite read here.'
                      : activePage === 'Lists'
                        ? 'Your reading lists will live here.'
                        : 'Your personal profile and account details will live here.'}
                </p>
              )}




              {activePage === 'Your Books' ? (
                <section style={{ width: '100%' }}>
                  {(() => {
                    const getTitle = (book: ShelvedBook) =>
                      book.title ?? book.Title ?? 'Untitled'

                    const getAuthor = (book: ShelvedBook) =>
                      book.author ?? book.Author ?? 'Unknown author'

                    const getStatus = getReadingStatus
                    const getRating = getSavedRating

                    const filteredBooks = books.filter((book) => {
                      const matchesFilter =
                        bookFilter === 'All' || getStatus(book) === bookFilter

                      const query = bookSearch.trim().toLowerCase()
                      const matchesSearch =
                        !query ||
                        getTitle(book).toLowerCase().includes(query) ||
                        getAuthor(book).toLowerCase().includes(query)

                      return matchesFilter && matchesSearch
                    })

                    const selectedBook = books.find(
                      (book) => (book.id ?? book.Id) === selectedBookId,
                    )

                    const counts = {
                      All: books.length,
                      'Currently reading': books.filter(
                        (book) => getStatus(book) === 'Currently reading',
                      ).length,
                      Finished: books.filter(
                        (book) => getStatus(book) === 'Finished',
                      ).length,
                      'To read': books.filter(
                        (book) => getStatus(book) === 'To read',
                      ).length,
                    }

                    const filters = ['All', 'Currently reading', 'Finished', 'To read']

                    const coverPlaceholder = (title: string) => (
                      <div
                        aria-label={`Cover unavailable for ${title}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: 220,
                          display: 'grid',
                          placeItems: 'center',
                          padding: 20,
                          boxSizing: 'border-box',
                          background: '#e6eee8',
                          color: '#315f50',
                          textAlign: 'center',
                          fontFamily: 'Georgia, serif',
                          fontSize: 23,
                        }}
                      >
                        {title}
                      </div>
                    )

                    return (
                      <>
                        {selectedBook && (
                          <button
                            type="button"
                            className="book-back-button"
                            onClick={() => {
                              closeBookRating()
                              setSelectedBookId(null)
                              setBookUpdateMessage('')
                            }}
                          >
                            <span aria-hidden="true">{'\u2190'}</span>
                            Back to your books
                          </button>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'end',
                            gap: 20,
                            flexWrap: 'wrap',
                            marginBottom: 26,
                          }}
                        >
                          <div>
                            <span className="eyebrow">YOUR COLLECTION</span>
                            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 42, margin: '8px 0' }}>
                              {selectedBook ? 'Book details' : 'Your Books'}
                            </h2>
                            <p style={{ margin: 0, color: '#77766f' }}>
                              {selectedBook
                                ? getTitle(selectedBook)
                                : `${books.length} ${books.length === 1 ? 'book' : 'books'}, all in one thoughtful place.`}
                            </p>
                          </div>
                        </div>

                        {booksLoading ? (
                          <p>Loading your library...</p>
                        ) : booksMessage ? (
                          <p role="alert">{booksMessage}</p>
                        ) : selectedBook ? (
                          <article
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(180px, 290px) minmax(0, 1fr)',
                              gap: 32,
                              padding: 28,
                              border: '1px solid #e7e5dc',
                              borderRadius: 20,
                              background: '#fff',
                            }}
                          >
                            <div
                              style={{
                                height: 420,
                                overflow: 'hidden',
                                borderRadius: 12,
                                background: '#e6eee8',
                              }}
                            >
                              {(() => {
                                const cover = selectedBook.coverUrl ?? selectedBook.CoverUrl
                                return cover ? (
                                  <img
                                    src={cover}
                                    alt={`Cover of ${getTitle(selectedBook)}`}
                                    onError={(event) => {
                                      event.currentTarget.style.display = 'none'
                                    }}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                    }}
                                  />
                                ) : (
                                  coverPlaceholder(getTitle(selectedBook))
                                )
                              })()}
                            </div>

                            <div>
                              <span className="eyebrow">BOOK DETAILS</span>
                              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 38 }}>
                                {getTitle(selectedBook)}
                              </h2>
                              <p style={{ fontSize: 19, color: '#77766f' }}>
                                {getAuthor(selectedBook)}
                              </p>

                              <hr style={{ border: 0, borderTop: '1px solid #e7e5dc', margin: '26px 0' }} />

                              <div className="reading-status-section">
                                <strong>Reading status</strong>
                                <div
                                  className="reading-status-controls"
                                  role="group"
                                  aria-label="Reading status"
                                >
                                  {(['Currently reading', 'Finished', 'To read'] as ReadingStatus[]).map(
                                    (status) => {
                                      const isSelected = getStatus(selectedBook) === status

                                      return (
                                        <button
                                          key={status}
                                          type="button"
                                          className={`reading-status-button${isSelected ? ' is-selected' : ''}`}
                                          aria-pressed={isSelected}
                                          disabled={updatingBook}
                                          onClick={async () => {
                                            if (isSelected) {
                                              if (
                                                status === 'Finished' &&
                                                getRating(selectedBook) === 0
                                              ) {
                                                openBookRating(selectedBook)
                                              }
                                              return
                                            }

                                            const updated = await updateBook(selectedBook, {
                                              status,
                                            })

                                            if (
                                              updated &&
                                              status === 'Finished' &&
                                              getRating(selectedBook) === 0
                                            ) {
                                              openBookRating({
                                                ...selectedBook,
                                                status,
                                              })
                                            }
                                          }}
                                        >
                                          <span>{status}</span>
                                          {isSelected && (
                                            <span aria-hidden="true">{'\u2713'}</span>
                                          )}
                                        </button>
                                      )
                                    },
                                  )}
                                </div>
                              </div>

                              {(() => {
                                const currentPage =
                                  selectedBook.currentPage ?? selectedBook.CurrentPage ?? 0
                                const pageCount =
                                  selectedBook.pageCount ?? selectedBook.PageCount ?? 0

                                const progress =
                                  pageCount > 0
                                    ? Math.min(100, Math.round((currentPage / pageCount) * 100))
                                    : 0

                                return (
                                  <section
                                    style={{
                                      marginTop: 24,
                                      padding: 20,
                                      borderRadius: 16,
                                      background: '#f3f6f2',
                                    }}
                                  >
                                    <h3 style={{ marginTop: 0 }}>Your reading progress</h3>

                                    <div
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                        gap: 14,
                                      }}
                                    >
                                      <label>
                                        Current page
                                        <input
                                          type="number"
                                          min={0}
                                          max={pageCount > 0 ? pageCount : undefined}
                                          value={currentPage}
                                          onChange={(event) => {
                                            const value = Number(event.target.value)
                                            setBooks((current) =>
                                              current.map((book) =>
                                                (book.id ?? book.Id) ===
                                                (selectedBook.id ?? selectedBook.Id)
                                                  ? { ...book, currentPage: value }
                                                  : book,
                                              ),
                                            )
                                          }}
                                          onBlur={() => {
                                            void updateBook(selectedBook, {
                                              currentPage: Math.max(
                                                0,
                                                Math.min(
                                                  pageCount > 0 ? pageCount : Number.MAX_SAFE_INTEGER,
                                                  currentPage,
                                                ),
                                              ),
                                            })
                                          }}
                                          style={{
                                            display: 'block',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            padding: 12,
                                            marginTop: 8,
                                            border: '1px solid #deded6',
                                            borderRadius: 10,
                                            font: 'inherit',
                                          }}
                                        />
                                      </label>

                                      <label>
                                        Total pages
                                        <input
                                          type="number"
                                          min={1}
                                          value={pageCount || ''}
                                          placeholder="Enter total pages"
                                          onChange={(event) => {
                                            const value = Number(event.target.value)
                                            setBooks((current) =>
                                              current.map((book) =>
                                                (book.id ?? book.Id) ===
                                                (selectedBook.id ?? selectedBook.Id)
                                                  ? { ...book, pageCount: value }
                                                  : book,
                                              ),
                                            )
                                          }}
                                          onBlur={() => {
                                            void updateBook(selectedBook, {
                                              pageCount: Math.max(0, pageCount),
                                              currentPage: Math.min(
                                                currentPage,
                                                pageCount > 0 ? pageCount : currentPage,
                                              ),
                                            })
                                          }}
                                          style={{
                                            display: 'block',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            padding: 12,
                                            marginTop: 8,
                                            border: '1px solid #deded6',
                                            borderRadius: 10,
                                            font: 'inherit',
                                          }}
                                        />
                                      </label>
                                    </div>

                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginTop: 22,
                                        marginBottom: 10,
                                      }}
                                    >
                                      <span>Reading progress</span>
                                      <strong>{pageCount > 0 ? `${progress}%` : 'Add total pages'}</strong>
                                    </div>

                                    <div
                                      style={{
                                        height: 9,
                                        borderRadius: 10,
                                        background: '#dfe6df',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <div
                                        style={{
                                          height: '100%',
                                          width: `${progress}%`,
                                          background: '#315f50',
                                          borderRadius: 10,
                                          transition: 'width 200ms ease',
                                        }}
                                      />
                                    </div>

                                    <p style={{ marginBottom: 0, color: '#77766f', fontSize: 13 }}>
                                      Enter your current page and the book's total pages to calculate progress.
                                    </p>
                                  </section>
                                )
                              })()}

                              {getStatus(selectedBook) === 'Finished' && (
                                <div className="book-rating-display">
                                  <strong>Your rating</strong>
                                  {getRating(selectedBook) > 0 ? (
                                    <p
                                      className="book-rating-stars"
                                      aria-label={`${getRating(selectedBook)} out of 5 stars`}
                                    >
                                      <span>
                                        {'\u2605'.repeat(getRating(selectedBook))}
                                      </span>
                                      <span className="book-rating-empty-stars">
                                        {'\u2605'.repeat(5 - getRating(selectedBook))}
                                      </span>
                                    </p>
                                  ) : (
                                    <p className="book-rating-prompt">
                                      No rating saved yet. Select Finished to rate this book.
                                    </p>
                                  )}
                                </div>
                              )}

                              {bookUpdateMessage && (
                                <p role="status" aria-live="polite">{bookUpdateMessage}</p>
                              )}
                            </div>
                          </article>
                        ) : books.length === 0 ? (
                          <div className="empty-page">
                            <div className="empty-page-icon" aria-hidden="true">{'\u21AA'}</div>
                            <h2>Your library is waiting.</h2>
                            <p>Visit Discover to search for books and add them here.</p>
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => setActivePage('Discover')}
                            >
                              Discover books
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="search"
                              aria-label="Search your books"
                              placeholder="Search title or author..."
                              value={bookSearch}
                              onChange={(event) => setBookSearch(event.target.value)}
                              style={{
                                width: '100%',
                                maxWidth: 360,
                                padding: '14px 16px',
                                marginBottom: 20,
                                border: '1px solid #deded6',
                                borderRadius: 12,
                                background: '#fff',
                                font: 'inherit',
                                boxSizing: 'border-box',
                              }}
                            />

                            <div
                              style={{
                                display: 'flex',
                                gap: 10,
                                flexWrap: 'wrap',
                                marginBottom: 30,
                              }}
                            >
                              {filters.map((filter) => (
                                <button
                                  key={filter}
                                  type="button"
                                  onClick={() => setBookFilter(filter)}
                                  aria-pressed={bookFilter === filter}
                                  style={{
                                    padding: '10px 16px',
                                    borderRadius: 24,
                                    border: '1px solid #e7e5dc',
                                    background: bookFilter === filter ? '#315f50' : '#fff',
                                    color: bookFilter === filter ? '#fff' : '#555950',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {filter} <span>{counts[filter as keyof typeof counts]}</span>
                                </button>
                              ))}
                            </div>

                            {filteredBooks.length === 0 ? (
                              <p>No books match your search and filter.</p>
                            ) : (
                              <div
                                className="saved-books-grid"
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                                  gap: 24,
                                }}
                              >
                                {filteredBooks.map((book, index) => {
                                  const title = getTitle(book)
                                  const author = getAuthor(book)
                                  const cover = book.coverUrl ?? book.CoverUrl

                                  return (
                                    <button
                                      key={book.id ?? book.Id ?? `${title}-${index}`}
                                      type="button"
                                      onClick={() => {
                                        selectBook(book)
                                      }}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 10,
                                        minWidth: 0,
                                        padding: 0,
                                        border: 0,
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        color: 'inherit',
                                      }}
                                    >
                                      <div
                                        style={{
                                          position: 'relative',
                                          width: '100%',
                                          height: 260,
                                          overflow: 'hidden',
                                          borderRadius: 10,
                                          background: '#e6eee8',
                                          boxShadow: '0 10px 24px rgba(36, 47, 39, 0.10)',
                                        }}
                                      >
                                        {cover ? (
                                          <>
                                            {coverPlaceholder(title)}
                                            <img
                                              src={cover}
                                              alt={`Cover of ${title}`}
                                              loading="lazy"
                                              onError={(event) => {
                                                event.currentTarget.style.display = 'none'
                                              }}
                                              style={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                              }}
                                            />
                                          </>
                                        ) : (
                                          coverPlaceholder(title)
                                        )}

                                        <span
                                          style={{
                                            position: 'absolute',
                                            bottom: 10,
                                            left: 10,
                                            padding: '6px 9px',
                                            borderRadius: 20,
                                            background: '#fff',
                                            color: '#315f50',
                                            fontSize: 10,
                                            fontWeight: 700,
                                          }}
                                        >
                                          {getStatus(book).toUpperCase()}
                                        </span>
                                      </div>

                                      <strong style={{ fontFamily: 'Georgia, serif', fontSize: 18 }}>
                                        {title}
                                      </strong>
                                      <span style={{ color: '#77766f', fontSize: 14 }}>
                                        {author}
                                      </span>
                                      {getRating(book) > 0 && (
                                        <span style={{ color: '#c58b35' }}>
                                          {'\u2605'.repeat(getRating(book))}
                                          <span style={{ color: '#d8d5ca' }}>
                                            {'\u2605'.repeat(5 - getRating(book))}
                                          </span>
                                        </span>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )}

                        {!selectedBook && (
                          <div className="library-refresh-actions">
                            <button
                              className="primary-button library-refresh-button"
                              type="button"
                              onClick={() => authToken && void loadMyBooks(authToken)}
                              disabled={booksLoading || !authToken || updatingBook}
                            >
                              {booksLoading ? 'Refreshing...' : 'Refresh library'}
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </section>
              ) : activePage === 'Lists' ? (
    <section style={{ width: '100%', textAlign: 'left' }}>
      {(() => {
        const getListId = (list: ReadingList) => list.id ?? list.Id ?? ''
        const getListName = (list: ReadingList) =>
          list.name ?? list.Name ?? 'Untitled list'
        const getListDescription = (list: ReadingList) =>
          list.description ?? list.Description ?? ''
        const booksInSelectedList = new Set<string>(
          [
            ...(selectedList?.books ?? []).map((book) => book.id ?? book.Id),
            ...(selectedList?.list.bookIds ??
              selectedList?.list.BookIds ??
              []),
          ].filter((id): id is string => Boolean(id)),
        )

        const availableBooks = books.filter((book) => {
          const id = book.id ?? book.Id
          return Boolean(id)
        })

        const inputStyle = {
          display: 'block',
          width: '100%',
          boxSizing: 'border-box' as const,
          padding: '13px 15px',
          marginTop: 8,
          border: '1px solid #deded6',
          borderRadius: 10,
          background: '#fff',
          font: 'inherit',
        }

        return (
          <>
            {selectedList ? (
              <header className="reading-list-detail-header">
                <button
                  type="button"
                  className="reading-list-back-link"
                  onClick={() => {
                    setSelectedList(null)
                    setBookToAdd('')
                    setShowListBookPicker(false)
                    setListsMessage('')
                  }}
                >
                  <span aria-hidden="true">{'\u2190'}</span>
                  All lists
                </button>
                <div className="reading-list-detail-heading">
                  <div>
                    <span className="reading-list-eyebrow">CUSTOM LIST</span>
                    <h1>{getListName(selectedList.list)}</h1>
                    {getListDescription(selectedList.list) && (
                      <p>{getListDescription(selectedList.list)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="primary-button reading-list-compact-button"
                    onClick={() => setShowListBookPicker((current) => !current)}
                  >
                    {showListBookPicker ? 'Close book picker' : '+ Add books from Your Books'}
                  </button>
                </div>
              </header>
            ) : (
              <header className="reading-lists-overview-header">
                <div>
                  <span className="reading-list-eyebrow">YOUR COLLECTIONS</span>
                  <h1>Your lists</h1>
                  <p>Collect books for moods, seasons, gifts, and future reading.</p>
                </div>
                <button
                  type="button"
                  className="primary-button reading-list-compact-button"
                  onClick={() => {
                    setShowCreateList(true)
                    setListsMessage('')
                  }}
                >
                  + Create new list
                </button>
              </header>
            )}

            {listsMessage && (
              <p role="status" aria-live="polite">{listsMessage}</p>
            )}

            {selectedList ? (
              <>
                {showListBookPicker && (
                  <div className="reading-list-add-panel">
                    <strong id="reading-list-picker-label">
                      Add a book from your library
                    </strong>
                    {availableBooks.length === 0 ? (
                      <p>
                        {books.length === 0
                          ? 'Your library is empty. Add books from Discover first.'
                          : 'No personal library books are available to add.'}
                      </p>
                    ) : (
                      <>
                        <div
                          className="reading-list-picker-options"
                          role="group"
                          aria-labelledby="reading-list-picker-label"
                        >
                          {availableBooks.map((book) => {
                            const id = (book.id ?? book.Id) as string
                            const title = book.title ?? book.Title ?? 'Untitled'
                            const author =
                              book.author ?? book.Author ?? 'Unknown author'
                            const cover = book.coverUrl ?? book.CoverUrl
                            const alreadyAdded = booksInSelectedList.has(id)

                            return (
                              <button
                                key={id}
                                type="button"
                                className={`reading-list-picker-option${bookToAdd === id ? ' is-selected' : ''}`}
                                onClick={() => setBookToAdd(id)}
                                disabled={listActionLoading || alreadyAdded}
                                aria-pressed={bookToAdd === id}
                                aria-label={`${title} by ${author}${alreadyAdded ? ', already in this list' : ''}`}
                              >
                                <span className="reading-list-picker-cover">
                                  {cover ? (
                                    <>
                                      <img
                                        src={cover}
                                        alt=""
                                        loading="lazy"
                                        onError={(event) => {
                                          event.currentTarget.style.display =
                                            'none'
                                          const fallback =
                                            event.currentTarget.nextElementSibling
                                          if (fallback instanceof HTMLElement) {
                                            fallback.style.display = 'grid'
                                          }
                                        }}
                                      />
                                      <span
                                        className="reading-list-picker-cover-placeholder"
                                        aria-hidden="true"
                                      >
                                        {'\u25A4'}
                                      </span>
                                    </>
                                  ) : (
                                    <span
                                      className="reading-list-picker-cover-placeholder"
                                      aria-hidden="true"
                                    >
                                      {'\u25A4'}
                                    </span>
                                  )}
                                </span>
                                <span className="reading-list-picker-copy">
                                  <span className="reading-list-picker-title">
                                    {title}
                                  </span>
                                  <span className="reading-list-picker-author">
                                    {author}
                                  </span>
                                </span>
                                <span className="reading-list-picker-state">
                                  {alreadyAdded
                                    ? 'Already added'
                                    : bookToAdd === id
                                      ? 'Selected'
                                      : 'Select'}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                        {availableBooks.every((book) => {
                          const id = book.id ?? book.Id
                          return Boolean(id && booksInSelectedList.has(id))
                        }) && (
                          <p className="reading-list-picker-empty">
                            All of your books are already in this list.
                          </p>
                        )}
                        <button
                          type="button"
                          className="primary-button reading-list-compact-button"
                          onClick={() => void addBookToReadingList()}
                          disabled={!bookToAdd || listActionLoading}
                        >
                          {listActionLoading ? 'Working...' : 'Add to list'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {selectedList.books.length === 0 ? (
                  <div className="reading-list-empty">
                    <h2>This list is waiting for its first book.</h2>
                    <p>Use “Add books from Your Books” to build your collection.</p>
                  </div>
                ) : (
                  <div className="reading-list-books-grid">
                    {selectedList.books.map((book, index) => {
                      const id = book.id ?? book.Id ?? ''
                      const title = book.title ?? book.Title ?? 'Untitled'
                      const author = book.author ?? book.Author ?? 'Unknown author'
                      const cover = book.coverUrl ?? book.CoverUrl
                      const status = getReadingStatus(book)

                      return (
                        <article key={id || `${title}-${index}`} className="reading-list-book-card">
                          <div className="reading-list-book-cover">
                            {cover && (
                              <img
                                src={cover}
                                alt={`Cover of ${title}`}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            {!cover && (
                              <span aria-label="Cover unavailable">{title}</span>
                            )}
                          </div>
                          <div className="reading-list-book-copy">
                            <span className={`reading-list-status reading-list-status-${status === 'Currently reading' ? 'reading' : status === 'Finished' ? 'finished' : 'to-read'}`}>
                              {status.toUpperCase()}
                            </span>
                            <h2>{title}</h2>
                            <p>{author}</p>
                          </div>
                          <button
                            className="reading-list-remove-button"
                            type="button"
                            onClick={() => id && void removeBookFromReadingList(id)}
                            disabled={!id || listActionLoading}
                          >
                            Remove
                          </button>
                        </article>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {showCreateList && (
                  <form
                    className="reading-list-create-form"
                    onSubmit={createReadingList}
                  >
                    <label htmlFor="new-list-name"><strong>List name</strong></label>
                    <input
                      id="new-list-name"
                      type="text"
                      value={newListName}
                      onChange={(event) => setNewListName(event.target.value)}
                      placeholder="e.g. Summer reads"
                      maxLength={80}
                      required
                      style={inputStyle}
                    />

                    <label htmlFor="new-list-description"><strong>Description (optional)</strong></label>
                    <input
                      id="new-list-description"
                      type="text"
                      value={newListDescription}
                      onChange={(event) => setNewListDescription(event.target.value)}
                      placeholder="What is this list for?"
                      maxLength={200}
                      style={inputStyle}
                    />

                    <button
                      className="primary-button reading-list-compact-button"
                      type="submit"
                      disabled={listActionLoading || !newListName.trim()}
                    >
                      {listActionLoading ? 'Creating...' : 'Create list'}
                    </button>
                    <button
                      className="reading-list-cancel-button"
                      type="button"
                      onClick={() => setShowCreateList(false)}
                      disabled={listActionLoading}
                    >
                      Cancel
                    </button>
                  </form>
                )}

                {listsLoading ? (
                  <p>Loading your lists...</p>
                ) : (
                  <div className="reading-lists-grid">
                    {readingLists.map((list, index) => {
                      const id = getListId(list)
                      const listBookIds = list.bookIds ?? list.BookIds ?? []
                      const listBooks = listBookIds
                        .map((bookId) =>
                          books.find((book) => (book.id ?? book.Id) === bookId),
                        )
                        .filter((book): book is ShelvedBook => Boolean(book))
                      const count = listBooks.length

                      return (
                        <article
                          key={id || `list-${index}`}
                          className="reading-list-card"
                          onClick={() => id && !listActionLoading && void openReadingList(list)}
                        >
                          <button
                            type="button"
                            className="reading-list-card-main"
                            onClick={(event) => {
                              event.stopPropagation()
                              if (id) void openReadingList(list)
                            }}
                            disabled={!id || listActionLoading}
                            aria-label={`Open ${getListName(list)}`}
                          >
                            <span className="reading-list-cover-collage" aria-hidden="true">
                              {listBooks.slice(0, 3).map((book, coverIndex) => {
                                const cover = book.coverUrl ?? book.CoverUrl
                                const title = book.title ?? book.Title ?? 'Book cover'
                                return (
                                  <span
                                    key={book.id ?? book.Id ?? `${title}-${coverIndex}`}
                                    className={`reading-list-cover-preview reading-list-cover-preview-${coverIndex + 1}`}
                                  >
                                    {cover ? (
                                      <img src={cover} alt="" loading="lazy" />
                                    ) : (
                                      <span>{title}</span>
                                    )}
                                  </span>
                                )
                              })}
                              {listBooks.length === 0 && (
                                <span className="reading-list-cover-empty" />
                              )}
                            </span>
                            <h2>{getListName(list)}</h2>
                            <span className="reading-list-book-count">
                              {count} {count === 1 ? 'book' : 'books'}
                            </span>
                            <span className="reading-list-open-link">
                              Open list <span aria-hidden="true">{'\u2192'}</span>
                            </span>
                          </button>
                          <button
                            type="button"
                            className="reading-list-delete-button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void deleteReadingList(list)
                            }}
                            disabled={!id || listActionLoading}
                            aria-label={`Delete ${getListName(list)}`}
                          >
                            Delete
                          </button>
                        </article>
                      )
                    })}
                    <button
                      type="button"
                      className="reading-list-create-card"
                      onClick={() => {
                        setShowCreateList(true)
                        setListsMessage('')
                      }}
                    >
                      <span className="reading-list-create-icon" aria-hidden="true">+</span>
                      <strong>Create new list</strong>
                      <span>Start a collection of your own</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )
      })()}
    </section>
    ) : activePage === 'Discover' ? (
      <section className="catalog-page" aria-live="polite">
        <header className="catalog-page-header">
          <div>
            <span className="eyebrow">SHELVED LIBRARY</span>
            <h1>Book Catalog</h1>
            <p className="workspace-description">
              Browse books added to Shelved’s shared catalog.
            </p>
          </div>
          <label className="catalog-search">
            <span className="sr-only">Search the shared catalog</span>
            <input
              type="search"
              value={catalogSearch}
              onChange={(event) => setCatalogSearch(event.target.value)}
              placeholder="Search by title or author"
            />
          </label>
        </header>

        {booksMessage && (
          <div className="catalog-state catalog-state-error" role="alert">
            <p>{booksMessage}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => authToken && void loadMyBooks(authToken)}
              disabled={booksLoading}
            >
              {booksLoading ? 'Checking...' : 'Retry My Books check'}
            </button>
          </div>
        )}

        {catalogLoading ? (
          <p className="catalog-state" role="status">
            Loading the shared catalog...
          </p>
        ) : catalogMessage ? (
          <div className="catalog-state catalog-state-error" role="alert">
            <p>{catalogMessage}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setCatalogMessage('')
                setCatalogRefreshKey((current) => current + 1)
              }}
            >
              Try again
            </button>
          </div>
        ) : catalogBooks.length === 0 ? (
          <div className="empty-page catalog-empty">
            <div className="empty-page-icon" aria-hidden="true">
              {'\u25A4'}
            </div>
            <h2>The shared catalog is waiting for its first books.</h2>
            <p>Books added by Shelved administrators will appear here.</p>
          </div>
        ) : (
          (() => {
            const query = catalogSearch.trim().toLowerCase()
            const visibleBooks = catalogBooks.filter((book) => {
              const title = book.title ?? book.Title ?? ''
              const authors = book.authors ?? book.Authors ?? []
              return (
                !query ||
                title.toLowerCase().includes(query) ||
                authors.some((author) => author.toLowerCase().includes(query))
              )
            })

            if (visibleBooks.length === 0) {
              return (
                <p className="catalog-state">
                  No catalog books match “{catalogSearch.trim()}”.
                </p>
              )
            }

            return (
              <div className="catalog-book-grid">
                {visibleBooks.map((book, index) => {
                  const id = book.id ?? book.Id ?? `${book.title}-${index}`
                  const title = book.title ?? book.Title ?? 'Untitled'
                  const authors = book.authors ?? book.Authors ?? []
                  const cover =
                    book.coverImageUrl ?? book.CoverImageUrl ?? ''
                  const publishedDate =
                    book.publishedDate ?? book.PublishedDate ?? ''
                  const publishedYear = publishedDate.match(/^\d{4}/)?.[0]
                  const catalogBookId = book.id ?? book.Id
                  const alreadyInMyBooks = Boolean(
                    catalogBookId &&
                      books.some(
                        (personalBook) =>
                          (personalBook.catalogBookId ??
                            personalBook.CatalogBookId) === catalogBookId,
                      ),
                  )
                  const addMessage = catalogBookId
                    ? catalogBookAddMessages[catalogBookId]
                    : undefined

                  return (
                    <article className="catalog-book-card" key={id}>
                      {cover ? (
                        <img
                          className="catalog-book-cover"
                          src={cover.replace(/^http:/, 'https:')}
                          alt={`Cover of ${title}`}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="catalog-book-cover-placeholder"
                          aria-label="No cover available"
                        >
                          {'\u25A4'}
                        </div>
                      )}
                      <div className="catalog-book-details">
                        <h2>{title}</h2>
                        <p>
                          {authors.length > 0
                            ? authors.join(', ')
                            : 'Unknown author'}
                        </p>
                        {publishedYear && (
                          <span>Published {publishedYear}</span>
                        )}
                      </div>
                      <div className="catalog-book-actions">
                        <button
                          type="button"
                          className="catalog-add-button"
                          onClick={() =>
                            catalogBookId &&
                            void addCatalogBookToMyBooks(
                              catalogBookId,
                              title,
                            )
                          }
                          disabled={
                            !catalogBookId ||
                            alreadyInMyBooks ||
                            booksLoading ||
                            addingCatalogBookId !== null
                          }
                        >
                          {alreadyInMyBooks
                            ? 'Already in My Books'
                            : addingCatalogBookId === catalogBookId
                              ? 'Adding...'
                              : booksLoading
                                ? 'Checking My Books...'
                                : 'Add to My Books'}
                        </button>
                        {addMessage && (
                          <span
                            className={
                              addMessage.failed
                                ? 'catalog-add-feedback catalog-add-error'
                                : 'catalog-add-feedback'
                            }
                            role={addMessage.failed ? 'alert' : 'status'}
                          >
                            {addMessage.message}
                          </span>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )
          })()
        )}
      </section>

                ) : activePage === 'Profile' ? (
                <div className="profile-page">
                  <span className="eyebrow">YOUR SPACE</span>
                  <h1>Profile &amp; settings</h1>
                  <p className="workspace-description">
                    Manage your account and how Shelved keeps in touch.
                  </p>

                  <section className="profile-card">
                    <div className="profile-card-heading">
                      <div className="profile-large-avatar">
                        {(profileUsername || 'U')
                          .split(/[ ._-]+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0].toUpperCase())
                          .join('')}
                      </div>
                      <div>
                        <h2>{profileUsername || 'Your profile'}</h2>
                        <p>Manage your account details.</p>
                      </div>
                    </div>

                    <form onSubmit={saveProfile}>
                      <div className="profile-fields">
                        <div className="profile-field">
                          <label htmlFor="profile-username">Username</label>
                          <input
                            id="profile-username"
                            type="text"
                            autoComplete="username"
                            value={profileUsername}
                            onChange={(event) =>
                              setProfileUsername(event.target.value)
                            }
                            required
                            maxLength={50}
                          />
                        </div>

                        <div className="profile-field">
                          <label htmlFor="profile-email">Email address</label>
                          <input
                            id="profile-email"
                            type="email"
                            autoComplete="email"
                            value={profileEmail}
                            onChange={(event) =>
                              setProfileEmail(event.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="profile-field">
                          <label htmlFor="profile-password">New password</label>
                          <input
                            id="profile-password"
                            type="password"
                            autoComplete="new-password"
                            value={profilePassword}
                            onChange={(event) =>
                              setProfilePassword(event.target.value)
                            }
                            placeholder="Leave blank to keep current password"
                            minLength={8}
                          />
                        </div>

                        <div className="profile-field">
                          <label htmlFor="reading-goal">
                            Annual reading goal
                          </label>
                          <input
                            id="reading-goal"
                            type="number"
                            min={1}
                            max={365}
                            value={readingGoal}
                            onChange={(event) =>
                              setReadingGoal(Number(event.target.value))
                            }
                            required
                          />
                          <small>How many books would you like to finish this year?</small>
                        </div>
                      </div>

                      <button
                        className="primary-button"
                        type="submit"
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile ? 'Saving...' : 'Save changes'}
                      </button>

                      {profileMessage && (
                        <p role="status" aria-live="polite">
                          {profileMessage}
                        </p>
                      )}
                    </form>
                  </section>

                  <section className="privacy-card">
                    <h2>Privacy &amp; account</h2>
                    <div className="privacy-row">
                      <div>
                        <strong>Delete account</strong>
                        <p>Permanently delete your account and all associated data.</p>
                      </div>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => void deleteAccount()}
                      >
                        Delete account
                      </button>
                    </div>
                  </section>
                </div>
              ) : 
activePage === 'Home' ? (
  <section style={{ width: '100%', textAlign: 'left' }}>
    {(() => {
      const getStatus = (book: ShelvedBook): ReadingStatus => {
        const status = book.status ?? book.Status
        return status === 'Currently reading' || status === 'Finished'
          ? status
          : 'To read'
      }

      const finished = books.filter(book => getStatus(book) === 'Finished').length
      const reading = books.filter(book => getStatus(book) === 'Currently reading').length
      const toRead = books.filter(book => getStatus(book) === 'To read').length
      const goal = readingGoal > 0 ? readingGoal : 12
      const goalProgress = Math.min(100, Math.round((finished / goal) * 100))
      const recentBooks = [...books].reverse().slice(0, 3)

      const stats = [
        { label: 'Books in library', value: books.length, icon: '\u{1F4DA}', color: '#e4eee7' },
        { label: 'Currently reading', value: reading, icon: '\u2728', color: '#e4edf0' },
        { label: 'Want to read', value: toRead, icon: '\u25F7', color: '#f7ead9' },
        { label: 'Books finished', value: finished, icon: '\u2713', color: '#f0e5ed' },
      ]

      return (
        <>
          {booksLoading && <p>Loading your library...</p>}
          {booksMessage && <p role="alert">{booksMessage}</p>}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
            marginBottom: 28,
          }}>
            <div>
              <span className="eyebrow">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }).toUpperCase()}
              </span>
              <h2 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(32px, 4vw, 44px)',
                margin: '12px 0 8px',
                color: '#203b30',
              }}>
                Welcome back, {profileUsername || 'reader'}.
              </h2>
              <p style={{ margin: 0, color: '#77766f' }}>
                A calm overview of your reading life.
              </p>
            </div>

            <button
              type="button"
              className="primary-button home-compact-button home-browse-button"
              onClick={() => setActivePage('Your Books')}
            >
              Browse your books <span aria-hidden="true">{'\u2192'}</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 18,
            marginBottom: 24,
          }}>
            {stats.map(stat => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 22,
                  border: '1px solid #e7e5dc',
                  borderRadius: 18,
                  background: '#fff',
                  minWidth: 0,
                }}
              >
                <div aria-hidden="true" style={{
                  width: 54,
                  height: 54,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 15,
                  background: stat.color,
                  color: '#315f50',
                  fontSize: 25,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 32,
                    lineHeight: 1.1,
                    color: '#203b30',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    marginTop: 7,
                    fontSize: 13,
                    color: '#77766f',
                  }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.7fr) minmax(270px, 1fr)',
            gap: 22,
            alignItems: 'stretch',
            marginBottom: 32,
          }}>
            <section style={{
              padding: 26,
              border: '1px solid #e7e5dc',
              borderRadius: 20,
              background: '#fff',
              minWidth: 0,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18,
              }}>
                <div>
                  <span className="eyebrow">YOUR LIBRARY</span>
                  <h2 style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 26,
                    margin: '8px 0 0',
                  }}>
                    Recent activity
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePage('Your Books')}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: '#315f50',
                    font: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  View all {'\u203A'}
                </button>
              </div>

              {recentBooks.length === 0 ? (
                <div style={{ padding: '24px 0', color: '#77766f' }}>
                  <p>Your reading journey starts here.</p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActivePage('Discover')}
                  >
                    Discover books
                  </button>
                </div>
              ) : (
                recentBooks.map((book, index) => {
                  const title = book.title ?? book.Title ?? 'Untitled'
                  const status = getStatus(book)
                  const icon = status === 'Finished' ? '\u2713'
                    : status === 'Currently reading' ? '\u2728'
                    : '\u{1F4DA}'

                  return (
                    <button
                      key={book.id ?? book.Id ?? `${title}-${index}`}
                      type="button"
                      onClick={() => {
                        selectBook(book)
                        setActivePage('Your Books')
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        padding: '16px 2px',
                        border: 0,
                        borderTop: '1px solid #eeece5',
                        background: 'transparent',
                        color: 'inherit',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span aria-hidden="true" style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 42,
                        height: 42,
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: index % 3 === 0 ? '#f7ead9'
                          : index % 3 === 1 ? '#e4edf0' : '#e4eee7',
                        color: '#315f50',
                        fontSize: 19,
                      }}>
                        {icon}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
                        <span style={{ display: 'block', lineHeight: 1.5 }}>
                          <strong>{title}</strong>
                        </span>
                        <span style={{ display: 'block', color: '#77766f', marginTop: 4 }}>
                          {status}
                        </span>
                      </span>
                      <span aria-hidden="true" style={{ fontSize: 24, color: '#315f50' }}>
                        {'\u203A'}
                      </span>
                    </button>
                  )
                })
              )}
            </section>

            <section style={{
              padding: 26,
              border: '1px solid #dfe7df',
              borderRadius: 20,
              background: 'linear-gradient(145deg, #edf4ee 0%, #fff 100%)',
              minWidth: 0,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 30,
              }}>
                <span aria-hidden="true" style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 54,
                  height: 54,
                  borderRadius: 15,
                  background: '#e1ece4',
                  color: '#315f50',
                  fontSize: 25,
                }}>
                  {'\u2728'}
                </span>
                <div>
                  <h2 style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 21,
                    margin: 0,
                  }}>
                    Your reading goal
                  </h2>
                  <p style={{ fontSize: 13, color: '#77766f', margin: '4px 0 0' }}>
                    Every book counts.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                marginBottom: 18,
              }}>
                <strong style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 46,
                  color: '#203b30',
                }}>
                  {finished}
                </strong>
                <span style={{ color: '#77766f', fontSize: 14 }}>
                  of {goal} books
                </span>
              </div>

              <div
                role="progressbar"
                aria-label="Reading goal progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={goalProgress}
                style={{
                  height: 9,
                  borderRadius: 20,
                  background: '#dfe6df',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  height: '100%',
                  width: `${goalProgress}%`,
                  background: '#315f50',
                  borderRadius: 20,
                  transition: 'width 200ms ease',
                }} />
              </div>

              <p style={{
                color: '#77766f',
                fontSize: 13,
                lineHeight: 1.7,
                margin: '14px 0 22px',
              }}>
                {goalProgress}% of your goal. Keep going—every finished book brings you closer.
              </p>

              <button
                type="button"
                onClick={() => setActivePage('Profile')}
                style={{
                  padding: 0,
                  border: 0,
                  background: 'transparent',
                  color: '#315f50',
                  font: 'inherit',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Change reading goal {'\u203A'}
              </button>
            </section>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}>
            <h2 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 28,
              margin: 0,
            }}>
              Recently added
            </h2>
            <button
              type="button"
              className="primary-button home-compact-button"
              onClick={() => setActivePage('Discover')}
            >
              Discover books {'\u2192'}
            </button>
          </div>

          {recentBooks.length === 0 ? (
            <div style={{
              padding: 28,
              border: '1px solid #e7e5dc',
              borderRadius: 18,
              background: '#fff',
              color: '#77766f',
            }}>
              No books in your library yet. Discover a book to get started.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
              gap: 22,
            }}>
              {recentBooks.map((book, index) => {
                const title = book.title ?? book.Title ?? 'Untitled'
                const author = book.author ?? book.Author ?? 'Unknown author'
                const cover = book.coverUrl ?? book.CoverUrl

                return (
                  <button
                    key={book.id ?? book.Id ?? `${title}-${index}`}
                    type="button"
                    onClick={() => {
                      selectBook(book)
                      setActivePage('Your Books')
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      minWidth: 0,
                      padding: 0,
                      border: 0,
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'inherit',
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: 220,
                      overflow: 'hidden',
                      borderRadius: 12,
                      background: '#e6eee8',
                      boxShadow: '0 10px 24px rgba(36, 47, 39, 0.10)',
                    }}>
                      <div style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: '100%',
                        height: '100%',
                        padding: 14,
                        boxSizing: 'border-box',
                        color: '#315f50',
                        textAlign: 'center',
                        fontFamily: 'Georgia, serif',
                      }}>
                        {title}
                      </div>
                      {cover && (
                        <img
                          src={cover}
                          alt={`Cover of ${title}`}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                    </div>
                    <strong style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 16,
                      lineHeight: 1.35,
                    }}>
                      {title}
                    </strong>
                    <span style={{ color: '#77766f', fontSize: 13 }}>
                      {author}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )
    })()}
  </section>
) : (
                <div className="empty-page">
                  <div className="empty-page-icon" aria-hidden="true">{'\u21AA'}</div>
                  <h2>
                    {activePage === 'Home'
                      ? 'Your story starts here.'
                      : `${activePage} is coming soon.`}
                  </h2>
                  <p>
                    We're building Shelved one page at a time.
                    Your books and reading details will be added later.
                  </p>
                </div>
              )}

              {activePage === 'Your Books' &&
                ratingModalBookId === selectedBookId &&
                ratingModalBookId &&
                (() => {
                  const ratingBook = books.find(
                    (book) => (book.id ?? book.Id) === ratingModalBookId,
                  )

                  if (!ratingBook) return null

                  const ratingBookTitle =
                    ratingBook.title ?? ratingBook.Title ?? 'Untitled'

                  return (
                    <div className="rating-modal-backdrop">
                      <section
                        className="rating-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="rating-modal-title"
                      >
                        <button
                          className="rating-modal-close"
                          type="button"
                          aria-label="Close rating dialog"
                          disabled={updatingBook}
                          onClick={closeBookRating}
                        >
                          {'\u00D7'}
                        </button>

                        <div className="rating-modal-icon" aria-hidden="true">
                          {'\u2605'}
                        </div>
                        <span className="rating-modal-eyebrow">BOOK FINISHED</span>
                        <h2 id="rating-modal-title">How was {ratingBookTitle}?</h2>
                        <p className="rating-modal-description">
                          Your rating helps Shelved make more thoughtful recommendations for you.
                        </p>

                        <div
                          className="rating-modal-stars"
                          role="group"
                          aria-label="Choose a rating from one to five stars"
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              aria-label={`${star} star${star === 1 ? '' : 's'}`}
                              aria-pressed={ratingDraft === star}
                              onClick={() => {
                                setRatingDraft(star)
                                setBookUpdateMessage('')
                              }}
                            >
                              {star <= ratingDraft ? '\u2605' : '\u2606'}
                            </button>
                          ))}
                        </div>
                        <p className="rating-modal-hint">Choose from 1 to 5 stars</p>

                        {bookUpdateMessage && (
                          <p className="rating-modal-error" role="alert">
                            {bookUpdateMessage}
                          </p>
                        )}

                        <button
                          className="primary-button rating-modal-save"
                          type="button"
                          disabled={ratingDraft < 1 || ratingDraft > 5 || updatingBook}
                          onClick={async () => {
                            if (ratingDraft < 1 || ratingDraft > 5 || updatingBook) return

                            if (getReadingStatus(ratingBook) !== 'Finished') {
                              closeBookRating()
                              return
                            }

                            const saved = await updateBook(ratingBook, {
                              rating: ratingDraft,
                            })

                            if (saved) {
                              setRatingModalBookId(null)
                              setRatingDraft(0)
                            }
                          }}
                        >
                          {updatingBook ? 'Saving...' : 'Save rating'}
                        </button>
                      </section>
                    </div>
                  )
                })()}

            </main>



          </section>



        </main>



      )



    }



    return (



      <main className="login-page">



        <section className="login-visual">



          <header className="brand">



            <span className="brand-icon" aria-hidden="true">S</span>



            <span>Shelved</span>



          </header>



          <div className="visual-copy">



            <span className="eyebrow">YOUR READING LIFE, IN ONE PLACE</span>



            <h1>A quieter way to keep track of every book.</h1>



            <p>



              Build your library, follow your progress, and always know



              what you want to read next.



            </p>



          </div>



          <div className="visual-footer">



            <span aria-hidden="true">{'\u21AA'}</span>



            <span>Your reading life, beautifully organized</span>



          </div>



        </section>



        <section className="login-panel">



          <div className="login-content">



            <div className="mobile-brand">



              <span className="brand-icon" aria-hidden="true">S</span>



              <span>Shelved</span>



            </div>



            {isRegistering ? (



              <>



                <div className="welcome-copy">



                  <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>



                  <h2>Create your account</h2>



                  <p>Make a little room for all your favourite stories.</p>



                </div>



                <form className="login-form" onSubmit={handleRegisterSubmit}>



                  <label htmlFor="register-username">Username</label>



                  <input



                    id="register-username"



                    name="username"



                    type="text"



                    value={username}



                    onChange={(event) => setUsername(event.target.value)}



                    placeholder="Choose a username"



                    autoComplete="username"



                    required



                  />



                  <label htmlFor="register-email">Email address</label>



                  <input



                    id="register-email"



                    name="email"



                    type="email"



                    value={registerEmail}



                    onChange={(event) => setRegisterEmail(event.target.value)}



                    placeholder="you@example.com"



                    autoComplete="email"



                    required



                  />



                  <label htmlFor="register-password">Password</label>



                  <input



                    id="register-password"



                    name="password"



                    type="password"



                    value={registerPassword}



                    onChange={(event) => setRegisterPassword(event.target.value)}



                    placeholder="Create a password"



                    autoComplete="new-password"



                    required



                  />



                  <button



                    className="primary-button"



                    type="submit"



                    disabled={isRegisteringRequest}



                  >



                    {isRegisteringRequest



                      ? 'Creating account...'



                      : 'Create account'}



                  </button>



                </form>



                {registerMessage && (



                  <p role="status" aria-live="polite">{registerMessage}</p>



                )}



                <p className="signup-prompt">



                  Already have an account?{' '}



                  <button



                    type="button"



                    onClick={() => {



                      setIsRegistering(false)



                      setRegisterMessage('')



                      setLoginMessage('')



                    }}



                  >



                    Log in



                  </button>



                </p>



              </>



            ) : (



              <>



                <div className="welcome-copy">






                  <h2>Log in to Shelved</h2>



                  <p>Your books have been waiting.</p>



                </div>



                <form className="login-form" onSubmit={handleLoginSubmit}>



                  <label htmlFor="login-email">Email or username</label>



                  <input



                    id="login-email"



                    name="usernameOrEmail"



                    type="text"



                    value={loginEmail}



                    onChange={(event) => setLoginEmail(event.target.value)}



                    placeholder="mara@reader.com"



                    autoComplete="username"



                    required



                  />



                  <label htmlFor="login-password">Password</label>



                  <input



                    id="login-password"



                    name="password"



                    type="password"



                    value={loginPassword}



                    onChange={(event) => setLoginPassword(event.target.value)}



                    placeholder="Enter your password"



                    autoComplete="current-password"



                    required



                  />



                  <div className="form-options">



                    <label className="remember-option">



                      <input type="checkbox" />



                      <span>Remember me</span>



                    </label>



                    <button className="text-button" type="button">



                      Forgot password?



                    </button>



                  </div>



                  <button



                    className="primary-button"



                    type="submit"



                    disabled={isLoggingIn}



                  >



                    {isLoggingIn ? 'Logging in...' : 'Log in'}



                  </button>



                </form>



                {loginMessage && (



                  <p role="status" aria-live="polite">{loginMessage}</p>



                )}



                <p className="signup-prompt">



                  New to Shelved?{' '}



                  <button



                    type="button"



                    onClick={() => {



                      setIsRegistering(true)



                      setRegisterMessage('')



                      setLoginMessage('')



                    }}



                  >



                    Create account



                  </button>



                </p>



              </>



            )}



            <p className="privacy-note">



              A little space for all the stories that stay with you.



            </p>



          </div>



        </section>



      </main>



    )



  }



  export default App
