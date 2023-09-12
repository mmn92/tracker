import React from "react";
import "./styles.css";

export type MVP = {
  name: string;
  obs: string;
  respawn: number;
  killed: number;
  timer: number;
};

export function localStorageManager(key: string) {
  const access_key = key;

  function save(data: Array<MVP>) {
    localStorage.setItem(access_key, JSON.stringify(data));
  }

  function get() {
    const storaged = localStorage.getItem(access_key);

    if (!storaged) return [];

    const parsed = JSON.parse(storaged);
    return parsed;
  }

  function clear() {
    localStorage.removeItem(access_key);
  }

  return { save, get, clear };
}

export default function Tracker(): React.ReactNode {
  const manager = React.useMemo(() => localStorageManager("mvp_list"), []);
  const [list, setList] = React.useState(manager.get() || []);
  const [timeNow, setTimeNow] = React.useState(getFormattedDateNow());
  const [showAdd, setShowAdd] = React.useState(false);

  function updateListItem(item: MVP) {
    const updated = list.map((i: MVP) => {
      if (i.name === item.name) {
        return {
          ...item,
        };
      }
      return i;
    });

    setList(updated);
  }

  function getFormattedDateNow() {
    const date = new Date();

    const hours = date
      .getHours()
      .toLocaleString("pt-BR", {
        minimumIntegerDigits: 2,
      })
      .replace(".", "");
    const minutes = date
      .getMinutes()
      .toLocaleString("pt-BR", {
        minimumIntegerDigits: 2,
      })
      .replace(".", "");

    return hours + minutes;
  }

  function handleSubmit(form: React.FormEvent<HTMLFormElement>) {
    form.preventDefault();

    /* CREATE NEW MVP OBJECT */
    const formData = new FormData(form.target as HTMLFormElement);

    const name = formData.get("name") as string;
    const timer = formData.get("timer") as string;
    const obs = (formData.get("obs") as string) || "";

    if (!name || !timer) return;

    const defaultTime = 0;

    const newMVP: MVP = {
      name,
      timer: parseInt(timer, 10),
      obs,
      killed: defaultTime,
      respawn: calculateRespawn(
        formatTime(parseInt(timer, 10)),
        formatTime(defaultTime)
      ),
    };

    /* INSERT NEW MVP IN LIST */
    const newList = [...list, newMVP];

    /* SAVE NEW LIST IN LOCALSTORAGE */
    manager.save(newList);
    setList(newList);
    (form.target as HTMLFormElement).reset();
  }

  function formatTime(time: number) {
    const parsed = time
      .toLocaleString("pt-BR", {
        minimumIntegerDigits: 4,
      })
      .replace(".", "");

    return parsed;
  }

  function calculateRespawn(killed: string, timer: string) {
    return parseInt(killed, 10) + parseInt(timer, 10);
  }

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeNow(getFormattedDateNow());
    }, 1000 * 30);

    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <h1>Tracker</h1>
      <h3>Time now: {timeNow}</h3>
      {showAdd ? (
        <>
          <form onSubmit={handleSubmit} style={{ marginBottom: "32px" }}>
            <label>
              <p>Nome</p>
              <input type="text" name="name" placeholder="Nome do MVP" />
            </label>
            <label>
              <p>Timer</p>
              <input
                type="number"
                name="timer"
                placeholder="Tempo de respawn"
                title="Deve ser salvo no format 0000. ex: 1h de respawn -> 0100"
              />
            </label>
            <label>
              <p>Obs</p>
              <input
                type="text"
                name="obs"
                placeholder="mapa de spawn etc..."
              />
            </label>
            <button
              style={{ backgroundColor: "#aaaaff", color: "white" }}
              type="submit"
            >
              Adicionar
            </button>
          </form>
          <button onClick={() => setShowAdd((p) => !p)}>X</button>
        </>
      ) : (
        <button onClick={() => setShowAdd((p) => !p)}>+</button>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        <button
          style={{ color: "white", backgroundColor: "red" }}
          onClick={() => {
            manager.clear();
          }}
        >
          Limpar
        </button>

        <button
          title="Persiste a lista atual (com as horas das mortes)"
          style={{ color: "white", backgroundColor: "green" }}
          onClick={() => {
            manager.save(list);
          }}
        >
          Salvar
        </button>
      </div>

      <ul>
        {list.map((item: MVP) => (
          <li key={item.name}>
            <MvpInfo mvp={item} update={updateListItem} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MvpInfo({
  mvp,
  update,
}: {
  mvp: MVP;
  update: (item: MVP) => void;
}) {
  function getFormattedDateNow() {
    const date = new Date();

    const hours = date
      .getHours()
      .toLocaleString("pt-BR", {
        minimumIntegerDigits: 2,
      })
      .replace(".", "");
    const minutes = date
      .getMinutes()
      .toLocaleString("pt-BR", {
        minimumIntegerDigits: 2,
      })
      .replace(".", "");

    return hours + minutes;
  }

  function hasRespawned() {
    const now = getFormattedDateNow();
    const toCompare = formatTime(mvp.respawn);

    const diff = parseInt(now, 10) - parseInt(toCompare, 10);

    return diff > 0;
  }

  function formatTime(time: number) {
    const parsed = time
      .toLocaleString("pt-BR", {
        minimumIntegerDigits: 4,
      })
      .replace(".", "");

    return parsed;
  }

  function calculateRespawn(killed: string, timer: string) {
    return parseInt(killed, 10) + parseInt(timer, 10);
  }

  function formatMVP(mvp: MVP) {
    return `${mvp.name} (+${formatTime(mvp.timer)}) - ${formatTime(
      mvp.killed
    )} -> ${formatTime(mvp.respawn)}`;
  }

  return (
    <div className={`${hasRespawned() ? "red" : ""}`}>
      <p style={{ display: "inline" }} title={mvp.obs}>
        {formatMVP(mvp)}
      </p>
      <form
        style={{ display: "inline" }}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          const newTime = formData.get("newTime") as string;

          if (!newTime) return;

          update({
            ...mvp,
            killed: parseInt(newTime, 10),
            respawn: calculateRespawn(mvp.timer, newTime),
          });
          (e.target as HTMLFormElement).reset();
        }}
      >
        <input type="text" name="newTime" />
      </form>
      <button
        onClick={() => {
          const now = getFormattedDateNow();

          update({
            ...mvp,
            killed: parseInt(now, 10),
            respawn: calculateRespawn(mvp.timer, now),
          });
        }}
      >
        Now
      </button>
    </div>
  );
}
