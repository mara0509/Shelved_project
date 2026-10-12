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









  const [books, setBooks] = useState<ShelvedBook[]>([])

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



  useEffect(() => {

    if (isLoggedIn && authToken && activePage === 'Your Books') {

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

                      ).replace('http\://', 'https\://'),

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



        }



      }



      if (!loginData.token) {



        throw new Error('Login succeeded, but the server did not return a token.')



      }





        setAuthToken(loginData.token)

        setProfileUsername(loginData.user.username)

        setProfileEmail(loginData.user.email)

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



            <h1>{activePage === 'Home' ? 'Welcome to Shelved.' : activePage}</h1>



            <p className="workspace-description">



              {activePage === 'Home'



                ? 'Your reading space, ready to make your own.'



                : activePage === 'Your Books'



                  ? 'Your personal library will live here.'



                  : activePage === 'Discover'



                    ? 'Find your next favourite read here.'



                    : activePage === 'Lists'



                      ? 'Your reading lists will live here.'



                      : 'Your personal profile and account details will live here.'}



            </p>



            {activePage === 'Your Books' ? (

              <section className="empty-page" aria-live="polite">

                <div className="empty-page-icon" aria-hidden="true">▤</div>

                <h2>Your Books</h2>

                {booksLoading ? (

                  <p>Loading your library...</p>

                ) : booksMessage ? (

                  <p role="alert">{booksMessage}</p>

                ) : books.length === 0 ? (

                  <p>Your library is empty for now. We'll add book discovery next.</p>

                ) : (

                  <div className="saved-books-grid">

                      {books.map((book, index) => {

                        const title = book.title ?? book.Title ?? 'Untitled'

                        const author = book.author ?? book.Author ?? 'Unknown author'

                        const coverUrl = book.coverUrl ?? book.CoverUrl



                        return (

                          <article

                            className="saved-book-card"

                            key={book.id ?? book.Id ?? `${title}-${index}`}

                          >

                            {coverUrl ? (

                              <img

                                className="saved-book-cover"

                                src={coverUrl}

                                alt={`Cover of ${title}`}

                                loading="lazy"

                              />

                            ) : (

                              <div className="saved-book-cover-placeholder">

                                No cover available

                              </div>

                            )}



                            <strong>{title}</strong>

                            <span>{author}</span>

                          </article>

                        )

                        })}

                    </div>

                )}

                <button

                  className="primary-button"

                  type="button"

                  onClick={() => authToken && void loadMyBooks(authToken)}

                  disabled={booksLoading || !authToken}

                >

                  {booksLoading ? 'Refreshing...' : 'Refresh library'}

                </button>

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
                      <p>Welcome to your reading space.</p>
                    </div>
                  </div>

                  <div className="profile-fields">
                    <div className="profile-field">
                      <label htmlFor="profile-username">Username</label>
                      <input id="profile-username" value={profileUsername} readOnly />
                    </div>
                    <div className="profile-field">
                      <label htmlFor="profile-email">Email address</label>
                      <input id="profile-email" type="email" value={profileEmail} readOnly />
                    </div>
                    <div className="profile-field">
                      <label htmlFor="profile-age">Age band</label>
                      <select id="profile-age" defaultValue="25–34" disabled>
                        <option value="18–24">18–24</option>
                        <option value="25–34">25–34</option>
                        <option value="35–44">35–44</option>
                        <option value="45+">45+</option>
                      </select>
                    </div>
                    <div className="profile-field">
                      <label htmlFor="profile-language">Language proficiency</label>
                      <select id="profile-language" defaultValue="Fluent" disabled>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Native">Native</option>
                      </select>
                    </div>
                  </div>

                  <button className="primary-button" type="button" disabled>Save changes</button>
                  <p className="profile-note">Your username and email are read-only for now.</p>
                </section>

                <section className="privacy-card">
                  <h2>Privacy &amp; account</h2>
                  <div className="privacy-row">
                    <div>
                      <strong>Delete personal data</strong>
                      <p>Remove reading history and preference data while keeping your account.</p>
                    </div>
                    <button type="button" disabled>Delete personal data</button>
                  </div>
                  <div className="privacy-row">
                    <div>
                      <strong>Delete account</strong>
                      <p>Permanently delete your account and all associated data.</p>
                    </div>
                    <button className="danger-button" type="button" disabled>Delete account</button>
                  </div>
                </section>
              </div>
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
