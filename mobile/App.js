import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:4000/api";

function useSession() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  return useMemo(() => ({ token, setToken, user, setUser }), [token, user]);
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", username: "" });

  async function submit() {
    try {
      const response = await axios.post(`${API_URL}/auth/${mode}`, form);
      onAuth(response.data.token, response.data.user);
    } catch (error) {
      Alert.alert("VibeVerse", error.response?.data?.message || "Could not authenticate");
    }
  }

  return (
    <LinearGradient colors={["#101b1a", "#0a1111", "#141f25"]} style={styles.authWrap}>
      <Text style={styles.eyebrow}>Mobile app</Text>
      <Text style={styles.hero}>VibeVerse</Text>
      <Text style={styles.subtle}>Swipe through the feed, collect boards, and post from anywhere.</Text>
      {mode === "signup" ? (
        <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#93a3a3" value={form.username} onChangeText={(username) => setForm({ ...form, username })} />
      ) : null}
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#93a3a3" autoCapitalize="none" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#93a3a3" secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} />
      <Pressable style={styles.cta} onPress={submit}>
        <Text style={styles.ctaText}>{mode === "login" ? "Enter VibeVerse" : "Create account"}</Text>
      </Pressable>
      <Pressable onPress={() => setMode(mode === "login" ? "signup" : "login")}>
        <Text style={styles.linkText}>{mode === "login" ? "Need an account? Sign up" : "Already have one? Log in"}</Text>
      </Pressable>
    </LinearGradient>
  );
}

function PostComposer({ token, boards, onCreated }) {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [anonymous, setAnonymous] = useState(false);
  const [media, setMedia] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!content.trim()) {
        setTags([]);
        return;
      }
      const response = await axios.post(
        `${API_URL}/posts/suggest-tags`,
        { text: content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTags(response.data.tags);
    }, 350);

    return () => clearTimeout(timeout);
  }, [content, token]);

  async function chooseMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("VibeVerse", "Media permission is needed to attach photos or clips.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"] });
    if (!result.canceled) {
      setMedia(result.assets[0]);
    }
  }

  async function submit() {
    const data = new FormData();
    data.append("content", content);
    data.append("tags", JSON.stringify(tags));
    data.append("boardIds", JSON.stringify(selectedBoards));
    data.append("isAnonymous", String(anonymous));
    if (media) {
      data.append("media", {
        uri: media.uri,
        type: media.mimeType || "image/jpeg",
        name: media.fileName || "upload.jpg"
      });
      data.append("mediaType", media.type === "video" ? "clip" : "image");
    } else {
      data.append("mediaType", "text");
    }

    await axios.post(`${API_URL}/posts`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });

    setContent("");
    setTags([]);
    setSelectedBoards([]);
    setAnonymous(false);
    setMedia(null);
    onCreated();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Create post</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        placeholder="What's the mood?"
        placeholderTextColor="#93a3a3"
        value={content}
        onChangeText={setContent}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardPicker}>
        {boards.map((board) => {
          const id = board._id || board.id;
          const active = selectedBoards.includes(id);
          return (
            <Pressable
              key={id}
              style={[styles.choiceChip, active && styles.choiceChipActive]}
              onPress={() =>
                setSelectedBoards((current) => (active ? current.filter((item) => item !== id) : [...current, id]))
              }
            >
              <Text style={styles.choiceText}>{board.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.row}>
        <Text style={styles.subtle}>Anonymous</Text>
        <Switch value={anonymous} onValueChange={setAnonymous} />
      </View>
      <Pressable style={styles.secondaryButton} onPress={chooseMedia}>
        <Text style={styles.secondaryText}>{media ? "Change attachment" : "Add image or clip"}</Text>
      </Pressable>
      <View style={styles.tagWrap}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.cta} onPress={submit}>
        <Text style={styles.ctaText}>Post vibe</Text>
      </Pressable>
    </View>
  );
}

function BoardCarousel({ boards }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Boards</Text>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {boards.map((board) => (
          <View key={board._id || board.id} style={styles.boardCard}>
            <Text style={styles.boardTitle}>{board.name}</Text>
            <Text style={styles.subtle}>{board.description || "No description yet."}</Text>
            <Text style={styles.subtle}>{board.isPrivate ? "Private board" : "Public board"}</Text>
            <View style={styles.boardMiniList}>
              {(board.posts || []).slice(0, 5).map((post) => (
                <Text key={post._id || post.id} style={styles.miniPost}>
                  {post.content?.slice(0, 40) || "Media post"}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function BoardCreator({ token, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  async function createBoard() {
    await axios.post(
      `${API_URL}/boards`,
      { name, description, isPrivate },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setName("");
    setDescription("");
    setIsPrivate(false);
    onCreated();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Create board</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Board name" placeholderTextColor="#93a3a3" />
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#93a3a3" />
      <View style={styles.row}>
        <Text style={styles.subtle}>Private board</Text>
        <Switch value={isPrivate} onValueChange={setIsPrivate} />
      </View>
      <Pressable style={styles.cta} onPress={createBoard}>
        <Text style={styles.ctaText}>Save board</Text>
      </Pressable>
    </View>
  );
}

function PostItem({ item, token, refresh }) {
  const mediaUrl = item.mediaUrl ? `${API_URL.replace("/api", "")}${item.mediaUrl}` : "";

  async function like() {
    await axios.post(`${API_URL}/posts/${item._id || item.id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    refresh();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.handle}>{item.isAnonymous ? "@anonymous" : `@${item.author?.username || "viber"}`}</Text>
      <Text style={styles.postBody}>{item.content}</Text>
      {item.mediaType === "image" && mediaUrl ? <Image source={{ uri: mediaUrl }} style={styles.postMedia} /> : null}
      <View style={styles.tagWrap}>
        {(item.tags || []).map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.row}>
        <Pressable style={styles.secondaryButton} onPress={like}>
          <Text style={styles.secondaryText}>Like {item.likes?.length || 0}</Text>
        </Pressable>
        <Text style={styles.subtle}>{item.comments?.length || 0} comments</Text>
      </View>
    </View>
  );
}

function ProfileCard({ user, token, refresh }) {
  const [bio, setBio] = useState(user.bio || "");
  const [interests, setInterests] = useState((user.interests || []).join(", "));

  async function save() {
    await axios.put(
      `${API_URL}/profiles/me`,
      {
        bio,
        interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
        username: user.username,
        avatar: user.avatar
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    refresh();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Profile</Text>
      <Text style={styles.handle}>@{user.username}</Text>
      <TextInput style={[styles.input, styles.multiline]} multiline value={bio} onChangeText={setBio} placeholder="Bio" placeholderTextColor="#93a3a3" />
      <TextInput style={styles.input} value={interests} onChangeText={setInterests} placeholder="music, travel, fashion" placeholderTextColor="#93a3a3" />
      <Pressable style={styles.cta} onPress={save}>
        <Text style={styles.ctaText}>Save profile</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const session = useSession();
  const [posts, setPosts] = useState([]);
  const [boards, setBoards] = useState([]);
  const [feed, setFeed] = useState([]);

  async function refresh() {
    if (!session.token) return;
    const headers = { Authorization: `Bearer ${session.token}` };
    const [meRes, postsRes, boardsRes, feedRes] = await Promise.all([
      axios.get(`${API_URL}/auth/me`, { headers }),
      axios.get(`${API_URL}/posts`, { headers }),
      axios.get(`${API_URL}/boards`, { headers }),
      axios.get(`${API_URL}/feed`, { headers })
    ]);
    session.setUser(meRes.data.user);
    setPosts(postsRes.data.posts);
    setBoards(boardsRes.data.boards);
    setFeed(feedRes.data.posts);
  }

  useEffect(() => {
    refresh();
  }, [session.token]);

  if (!session.token || !session.user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <AuthScreen onAuth={(token, user) => { session.setToken(token); session.setUser(user); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <LinearGradient colors={["#0d1514", "#122026"]} style={styles.heroCard}>
              <Text style={styles.eyebrow}>VibeFeed</Text>
              <Text style={styles.hero}>Welcome back, @{session.user.username}</Text>
              <Text style={styles.subtle}>Your feed mixes interests, recent activity, and engagement.</Text>
            </LinearGradient>
            <PostComposer token={session.token} boards={boards} onCreated={refresh} />
            <BoardCreator token={session.token} onCreated={refresh} />
            <BoardCarousel boards={boards} />
            <ProfileCard user={session.user} token={session.token} refresh={refresh} />
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Swipe feed</Text>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {feed.map((item) => (
                  <View key={item._id || item.id} style={styles.feedCard}>
                    <Text style={styles.handle}>{item.isAnonymous ? "@anonymous" : `@${item.author?.username || "viber"}`}</Text>
                    <Text style={styles.postBody}>{item.content}</Text>
                    <Text style={styles.subtle}>Vibe score {item.vibeScore}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.sectionTitle}>Recent posts</Text>
          </View>
        }
        data={posts}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={({ item }) => <PostItem item={item} token={session.token} refresh={refresh} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1111" },
  authWrap: { flex: 1, padding: 24, justifyContent: "center" },
  headerWrap: { gap: 16, paddingBottom: 12 },
  listContent: { padding: 16, gap: 14 },
  heroCard: { borderRadius: 26, padding: 20, marginBottom: 4 },
  eyebrow: { color: "#b7ff70", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  hero: { color: "#f5f8f1", fontSize: 30, fontWeight: "800", marginBottom: 8 },
  subtle: { color: "#92a4a3", fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: "#141d1d",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(183,255,112,0.08)",
    gap: 12
  },
  input: {
    backgroundColor: "#1b2525",
    borderRadius: 16,
    color: "#f5f8f1",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  cta: {
    backgroundColor: "#b7ff70",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center"
  },
  ctaText: { color: "#0b1111", fontWeight: "800" },
  linkText: { color: "#d8f2c1", marginTop: 16, textAlign: "center" },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#1d2928"
  },
  secondaryText: { color: "#f1f4eb", fontWeight: "700" },
  sectionTitle: { color: "#f5f8f1", fontSize: 20, fontWeight: "800" },
  boardPicker: { gap: 10 },
  choiceChip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#1d2928" },
  choiceChipActive: { backgroundColor: "#2d4f33" },
  choiceText: { color: "#e3efe0" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(183,255,112,0.12)" },
  tagText: { color: "#b7ff70", fontSize: 12, fontWeight: "700" },
  boardCard: { width: 260, marginRight: 12, borderRadius: 20, backgroundColor: "#1b2525", padding: 16, gap: 10 },
  boardTitle: { color: "#f5f8f1", fontSize: 18, fontWeight: "700" },
  boardMiniList: { gap: 8 },
  miniPost: { color: "#d6dfdd", backgroundColor: "#111818", borderRadius: 12, padding: 10 },
  handle: { color: "#e6f3d1", fontWeight: "800" },
  postBody: { color: "#f5f8f1", fontSize: 15, lineHeight: 22 },
  postMedia: { width: "100%", height: 240, borderRadius: 18, marginTop: 8 },
  feedCard: { width: 280, marginRight: 12, borderRadius: 20, backgroundColor: "#172020", padding: 16, gap: 10 }
});
