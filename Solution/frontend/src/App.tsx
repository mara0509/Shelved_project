import { useEffect, useState, type FormEvent } from 'react'



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



function App() {



  const [isRegistering, setIsRegistering] = useState(false)



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

  const [bookFilter, setBookFilter] = useState('All')
  const [bookSearch, setBookSearch] = useState('')
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [bookUpdateMessage, setBookUpdateMessage] = useState('')
  const [updatingBook, setUpdatingBook] = useState(false)

  const [booksLoading, setBooksLoading] = useState(false)

  const [booksMessage, setBooksMessage] = useState('')

  const [searchQuery, setSearchQuery] = useState('')

  const [searchResults, setSearchResults] = useState<GoogleBookResult[]>([])

  const [searchLoading, setSearchLoading] = useState(false)

  const [searchMessage, setSearchMessage] = useState('')

  const [addingBookId, setAddingBookId] = useState<string | null>(null)

  const [addedBookIds, setAddedBookIds] = useState<string[]>([])



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



  const loadMyBooks = async (token: string) => {

    setBooksLoading(true)

    setBooksMessage('')



    try {

      const response = await fetch('/Books', {

        headers: {

          Authorization: `Bearer ${token}`,

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

  const updateBook = async (
    book: ShelvedBook,
    changes: {
      status?: ReadingStatus
      rating?: number
      currentPage?: number
      pageCount?: number
    },
  ) => {
    const id = book.id ?? book.Id

    if (!authToken || !id) {
      setBookUpdateMessage('Could not identify this book. Refresh your library.')
      return
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
    } catch (error) {
      setBookUpdateMessage(
        error instanceof Error ? error.message : 'Could not update this book.',
      )
    } finally {
      setUpdatingBook(false)
    }
  }


  useEffect(() => {

    if (isLoggedIn && authToken && (activePage === 'Your Books' || activePage === 'Home')) {

      void loadMyBooks(authToken)

    }

  }, [isLoggedIn, authToken, activePage])



  const searchBooks = async (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault()

    const query = searchQuery.trim()

    if (!query || !authToken) return



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



  const addBookToLibrary = async (result: GoogleBookResult) => {

    if (!authToken || !result.volumeInfo?.title) return

    setAddingBookId(result.id)

    setSearchMessage('')



    try {

      const title = result.volumeInfo.title

      const author = result.volumeInfo.authors?.join(', ') ?? 'Unknown author'

      const alreadySaved = books.some((book) =>

        (book.title ?? book.Title ?? '').trim().toLowerCase() === title.trim().toLowerCase() &&

        (book.author ?? book.Author ?? '').trim().toLowerCase() === author.trim().toLowerCase()

      )

      if (alreadySaved) {

        setAddedBookIds((current) => current.includes(result.id) ? current : [...current, result.id])

        setSearchMessage('That book is already in Your Books.')

        return

      }



      const response = await fetch('/Books', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          Authorization: `Bearer ${authToken}`,

        },

       body: JSON.stringify({
         title,
         author,
         coverUrl: (
           result.volumeInfo?.imageLinks?.thumbnail ??
           result.volumeInfo?.imageLinks?.smallThumbnail ??
           ''
         ).replace('http://', 'https://'),
         description: result.volumeInfo?.description ?? '',
         pageCount: result.volumeInfo?.pageCount ?? 0,
         currentPage: 0,
         status: 'To read',
         rating: 0,
       }),

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

        throw new Error(message || `Could not add book (${response.status}).`)

      }



      setAddedBookIds((current) => current.includes(result.id) ? current : [...current, result.id])

      await loadMyBooks(authToken)

    } catch (error) {

      setSearchMessage(error instanceof Error ? error.message : 'Could not add this book. Please try again.')

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

          readingGoal?: number
          ReadingGoal?: number

        }



      }



      if (!loginData.token) {



        throw new Error('Login succeeded, but the server did not return a token.')



      }





        setAuthToken(loginData.token)

        setProfileUsername(loginData.user.username)

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
      setProfileUsername('');
      setProfileEmail('');
      setBooks([]);
      setSearchResults([]);
      setAddedBookIds([]);
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

  if (isLoggedIn)



  {



    const menuItems = [



      { name: 'Home', icon: '⌂' },



      { name: 'Your Books', icon: '▤' },



      { name: 'Discover', icon: '⌕' },



      { name: 'Lists', icon: '☷' },



      { name: 'Profile', icon: '♙' },



    ]



    const displayName = profileUsername || loginEmail



    const initials = displayName



      .split(/[ .**\\\\\\\_**-]+/)



      .filter(Boolean)



      .slice(0, 2)



      .map((part) => part[0].toUpperCase())



      .join('')



    const handleLogout = () => {



      setIsLoggedIn(false)

      setAuthToken(null)

      setProfileUsername('')

      setProfileEmail('')

      setBooks([])

      setBooksMessage('')

      setSearchResults([])

      setSearchQuery('')

      setAddedBookIds([])

      setSearchMessage('')



      setIsRegistering(false)



      setLoginEmail('')



      setLoginPassword('')



      setLoginMessage('')



      setActivePage('Home')



    }



    return (



      <main className="shelved-layout">



        <aside className="sidebar">



          <div className="sidebar-brand">



            <span className="sidebar-logo" aria-hidden="true">▮▮</span>



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



              <span className="nav-icon" aria-hidden="true">↪</span>



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



            <span className="eyebrow">YOUR READING LIFE, IN ONE PLACE</span>



            <h1>{activePage === 'Home' ? `Welcome back, ${profileUsername || 'reader'}.` : activePage}</h1>



            <p className="workspace-description">



              {activePage === 'Home'



                ? 'Here is a look at your reading life so far.'



                : activePage === 'Your Books'



                  ? 'Your personal library will live here.'



                  : activePage === 'Discover'



                    ? 'Find your next favourite read here.'



                    : activePage === 'Lists'



                      ? 'Your reading lists will live here.'



                      : 'Your personal profile and account details will live here.'}



            </p>



            {activePage === 'Your Books' ? (
              <section style={{ width: '100%' }}>
                {(() => {
                  const getTitle = (book: ShelvedBook) =>
                    book.title ?? book.Title ?? 'Untitled'

                  const getAuthor = (book: ShelvedBook) =>
                    book.author ?? book.Author ?? 'Unknown author'

                  const getStatus = (book: ShelvedBook): ReadingStatus => {
                    const status = book.status ?? book.Status
                    return status === 'Currently reading' || status === 'Finished'
                      ? status
                      : 'To read'
                  }

                  const getRating = (book: ShelvedBook) =>
                    book.rating ?? book.Rating ?? 0

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

                        {selectedBook && (
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                              setSelectedBookId(null)
                              setBookUpdateMessage('')
                            }}
                          >
                            Back to library
                          </button>
                        )}
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

                            <label htmlFor="book-status"><strong>Reading status</strong></label>
                            <select
                              id="book-status"
                              value={getStatus(selectedBook)}
                              disabled={updatingBook}
                              onChange={(event) =>
                                void updateBook(selectedBook, {
                                  status: event.target.value as ReadingStatus,
                                })
                              }
                              style={{
                                display: 'block',
                                width: '100%',
                                maxWidth: 320,
                                marginTop: 10,
                                padding: 13,
                                border: '1px solid #deded6',
                                borderRadius: 10,
                                background: '#fff',
                                font: 'inherit',
                              }}
                            >
                              <option value="To read">To read</option>
                              <option value="Currently reading">Currently reading</option>
                              <option value="Finished">Finished</option>
                            </select>

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

                            <p style={{ marginTop: 28 }}>
                              <strong>How much did you like it?</strong>
                            </p>
                            <div
                              role="group"
                              aria-label="Rate this book from one to five stars"
                              style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                            >
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  disabled={updatingBook}
                                  aria-label={`${star} star${star === 1 ? '' : 's'}`}
                                  aria-pressed={getRating(selectedBook) === star}
                                  onClick={() =>
                                    void updateBook(selectedBook, { rating: star })
                                  }
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    color: star <= getRating(selectedBook) ? '#c58b35' : '#d8d5ca',
                                    fontSize: 34,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ★
                                </button>
                              ))}
                            </div>

                            {getRating(selectedBook) === 0 && (
                              <p style={{ color: '#77766f', fontSize: 14 }}>
                                Tap a star to rate this book.
                              </p>
                            )}

                            {bookUpdateMessage && (
                              <p role="status" aria-live="polite">{bookUpdateMessage}</p>
                            )}
                          </div>
                        </article>
                      ) : books.length === 0 ? (
                        <div className="empty-page">
                          <div className="empty-page-icon" aria-hidden="true">▤</div>
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
                                      setSelectedBookId(book.id ?? book.Id ?? null)
                                      setBookUpdateMessage('')
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
                                        {'★'.repeat(getRating(book))}
                                        <span style={{ color: '#d8d5ca' }}>
                                          {'★'.repeat(5 - getRating(book))}
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

                      <div style={{ marginTop: 28 }}>
                        <button
                          className="primary-button"
                          type="button"
                          onClick={() => authToken && void loadMyBooks(authToken)}
                          disabled={booksLoading || !authToken || updatingBook}
                        >
                          {booksLoading ? 'Refreshing...' : 'Refresh library'}
                        </button>
                      </div>
                    </>
                  )
                })()}
              </section>
            ) : activePage === 'Discover' ? (

              <section className="empty-page discover-page" aria-live="polite">

                <form onSubmit={searchBooks} className="discover-search-form" style={{ width: '100%', maxWidth: 760, margin: '0 auto 28px' }}>

                  <label htmlFor="book-search" style={{ display: 'block', textAlign: 'left', marginBottom: 10, fontWeight: 600 }}>Search by book title or author</label>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

                    <input

                      id="book-search"

                      type="search"

                      value={searchQuery}

                      onChange={(event) => setSearchQuery(event.target.value)}

                      placeholder="e.g. The Secret History or Donna Tartt"

                      style={{ flex: '1 1 280px', minWidth: 0, padding: '15px 17px', border: '1px solid #deded6', borderRadius: 12, background: '#fff', font: 'inherit' }}

                    />

                    <button className="primary-button" type="submit" disabled={searchLoading || !searchQuery.trim() || !authToken} style={{ width: 'auto', minWidth: 130, padding: '14px 24px' }}>

                      {searchLoading ? 'Searching...' : 'Search books'}

                    </button>

                  </div>

                </form>



                {searchMessage && <p role="status" style={{ margin: '0 auto 20px', maxWidth: 760 }}>{searchMessage}</p>}



                {searchResults.length > 0 ? (

                  <div className="discover-results" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, textAlign: 'left' }}>

                    {searchResults.map((result) => {

                      const info = result.volumeInfo ?? {}

                      const title = info.title ?? 'Untitled'

                      const author = info.authors?.join(', ') ?? 'Unknown author'

                      const cover = (info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail)?.replace('http\://', 'https\://')

                      const added = addedBookIds.includes(result.id)

                      return (

                        <article key={result.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 18, border: '1px solid #e7e5dc', borderRadius: 16, background: '#fff' }}>

                          {cover ? (

                            <img src={cover} alt={`Cover of ${title}`} loading="lazy" style={{ display: 'block', height: 190, maxWidth: '100%', width: 'auto', objectFit: 'contain', alignSelf: 'center' }} />

                          ) : (

                            <div aria-label="No cover available" style={{ height: 190, width: 125, alignSelf: 'center', display: 'grid', placeItems: 'center', padding: 12, boxSizing: 'border-box', borderRadius: 8, background: '#e6eee8', color: '#315f50', textAlign: 'center' }}>Cover unavailable</div>

                          )}

                          <div style={{ flex: 1 }}>

                            <h2 style={{ fontSize: 19, lineHeight: 1.3, margin: '4px 0 8px' }}>{title}</h2>

                            <p style={{ margin: '0 0 8px', color: '#77766f' }}>{author}</p>

                            {info.publishedDate && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#77766f' }}>Published {info.publishedDate}</p>}

                            {info.description && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#62645e' }}>{info.description.replace(/<[^>]\*>/g, '').slice(0, 180)}{info.description.length > 180 ? '…' : ''}</p>}

                          </div>

                          <button className="primary-button" type="button" onClick={() => void addBookToLibrary(result)} disabled={added || addingBookId === result.id || !info.title}>

                            {added ? 'Added to My Books' : addingBookId === result.id ? 'Adding...' : 'Add to My Books'}

                          </button>

                        </article>

                      )

                    })}

                  </div>

                ) : !searchLoading && !searchMessage ? (

                  <div style={{ padding: '26px 12px' }}>

                    <div className="empty-page-icon" aria-hidden="true">⌕</div>

                    <h2>Find your next favourite read.</h2>

                    <p>Search millions of books and add the ones you want to keep in your personal library.</p>

                  </div>

                ) : null}

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
            ) : activePage === 'Home' ? (
                        <section style={{ width: '100%', textAlign: 'left' }}>
                          {(() => {
                            const getStatus = (book: ShelvedBook) => {
                              const status = book.status ?? book.Status
                              return status === 'Currently reading' || status === 'Finished'
                                ? status
                                : 'To read'
                            }

                            const finished = books.filter((book) => getStatus(book) === 'Finished').length
                            const reading = books.filter((book) => getStatus(book) === 'Currently reading').length
                            const toRead = books.filter((book) => getStatus(book) === 'To read').length

                            const goal = readingGoal > 0 ? readingGoal : 12
                            const goalProgress = Math.min(100, Math.round((finished / goal) * 100))

                            const recentBooks = books.slice(-4).reverse()

                            const stats = [
                              { label: 'Books in library', value: books.length },
                              { label: 'Currently reading', value: reading },
                              { label: 'Want to read', value: toRead },
                              { label: 'Books finished', value: finished },
                            ]

                            return (
                              <>
                                {booksLoading && <p>Loading your library...</p>}
                                {booksMessage && <p role="alert">{booksMessage}</p>}

                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                                    gap: 18,
                                    marginBottom: 24,
                                  }}
                                >
                                  {stats.map((stat) => (
                                    <div
                                      key={stat.label}
                                      style={{
                                        padding: 22,
                                        border: '1px solid #e7e5dc',
                                        borderRadius: 16,
                                        background: '#fff',
                                      }}
                                    >
                                      <div style={{ color: '#77766f', fontSize: 14 }}>{stat.label}</div>
                                      <div
                                        style={{
                                          fontFamily: 'Georgia, serif',
                                          fontSize: 40,
                                          marginTop: 8,
                                          color: '#315f50',
                                        }}
                                      >
                                        {stat.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div
                                  style={{
                                    padding: 26,
                                    marginBottom: 32,
                                    border: '1px solid #e7e5dc',
                                    borderRadius: 16,
                                    background: '#fff',
                                  }}
                                >
                                  <span className="eyebrow">YOUR READING GOAL</span>
                                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, margin: '8px 0' }}>
                                    {finished} of {goal} books finished
                                  </h2>

                                  <div
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={goalProgress}
                                    aria-label="Reading goal progress"
                                    style={{
                                      height: 10,
                                      borderRadius: 10,
                                      background: '#dfe6df',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: '100%',
                                        width: `${goalProgress}%`,
                                        background: '#315f50',
                                        borderRadius: 10,
                                        transition: 'width 200ms ease',
                                      }}
                                    />
                                  </div>

                                  <p style={{ margin: '12px 0 0', color: '#77766f', fontSize: 14 }}>
                                    {goalProgress}% of your goal. You can change your goal in Profile.
                                  </p>
                                </div>

                                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, marginBottom: 16 }}>
                                  Recently added
                                </h2>

                                {recentBooks.length === 0 ? (
                                  <p style={{ color: '#77766f' }}>
                                    No books yet. Visit Discover to add your first one.
                                  </p>
                                ) : (
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                      gap: 22,
                                    }}
                                  >
                                    {recentBooks.map((book, index) => {
                                      const title = book.title ?? book.Title ?? 'Untitled'
                                      const author = book.author ?? book.Author ?? 'Unknown author'
                                      const cover = book.coverUrl ?? book.CoverUrl

                                      return (
                                        <button
                                          key={book.id ?? book.Id ?? `${title}-${index}`}
                                          type="button"
                                          onClick={() => {
                                            setSelectedBookId(book.id ?? book.Id ?? null)
                                            setBookUpdateMessage('')
                                            setActivePage('Your Books')
                                          }}
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
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
                                              height: 220,
                                              overflow: 'hidden',
                                              borderRadius: 10,
                                              background: '#e6eee8',
                                              boxShadow: '0 10px 24px rgba(36, 47, 39, 0.10)',
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'grid',
                                                placeItems: 'center',
                                                padding: 14,
                                                boxSizing: 'border-box',
                                                color: '#315f50',
                                                textAlign: 'center',
                                                fontFamily: 'Georgia, serif',
                                              }}
                                            >
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
                                          <strong style={{ fontFamily: 'Georgia, serif', fontSize: 16 }}>
                                            {title}
                                          </strong>
                                          <span style={{ color: '#77766f', fontSize: 13 }}>{author}</span>
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
                <div className="empty-page-icon" aria-hidden="true">▤</div>
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



          <span aria-hidden="true">▤</span>



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



                <span className="eyebrow">WELCOME BACK</span>



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
