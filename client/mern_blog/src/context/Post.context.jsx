


const PostContext = createContext();

const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

    const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/posts");
        if (!response.ok) {
            throw new Error("Failed to fetch posts");
        }
      const data = await response.json();
      setPosts(data.data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    };
<PostContext.Provider value={{ posts, loading, error, fetchPosts }}>
    {children}
</PostContext.Provider>