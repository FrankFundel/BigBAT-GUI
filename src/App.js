import React, { Component } from "react";
import "./App.css";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Badge from "@mui/material/Badge";
import Checkbox from "@mui/material/Checkbox";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Select from "@mui/material/Select";
import Fade from "@mui/material/Fade";
import CircularProgress from "@mui/material/CircularProgress";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import moment from "moment";
import MapContainer from "./components/MapContainer";
import { FixedSizeList } from "react-window";
import BackdropFilter from "react-backdrop-filter";
import LoadingButton from "@mui/lab/LoadingButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";

import FolderIcon from "@mui/icons-material/Folder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlineIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ThinkIcon from "@mui/icons-material/AutoFixHighOutlined";

import Spectrogram from "./components/Spectrogram";
import BarChart from "./components/BarChart";

export const eel = window.eel;
eel.set_host("ws://localhost:8080");

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#6b6b6b #2b2b2b",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#6b6b6b",
            minHeight: 24,
            border: "3px solid #2b2b2b",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus":
            {
              backgroundColor: "#959595",
            },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active":
            {
              backgroundColor: "#959595",
            },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
              backgroundColor: "#959595",
            },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "#2b2b2b",
          },
        },
      },
    },
  },
});

const classifiers = [
  {
    name: "German Bats",
    path: "models/BigBAT.pth",
    classes: [
      "Rhinolophus ferrumequinum",
      "Rhinolophus hipposideros",
      "Myotis daubentonii",
      "Myotis brandtii",
      "Myotis mystacinus",
      "Myotis emarginatus",
      "Myotis nattereri",
      "Myotis myotis",
      "Myotis dasycneme",
      "Nyctalus noctula",
      "Nyctalus leisleri",
      "Pipistrellus pipistrellus",
      "Pipistrellus nathusii",
      "Pipistrellus kuhlii",
      "Eptesicus serotinus",
      "Eptesicus nilssonii",
      "Miniopterus schreibersii",
      "Vespertilio murinus",
    ],
    classes_short: [
      "Rfer",
      "Rhip",
      "Mdaub",
      "Mbrandt",
      "Mmys",
      "Mem",
      "Mnat",
      "Mmyo",
      "Mdas",
      "Nnoc",
      "Nleis",
      "Ppip",
      "Pnat",
      "Pkuhl",
      "Eser",
      "Enil",
      "Mschreib",
      "Vmur",
    ],
  },
];

export class App extends Component {
  constructor() {
    super();
    this.state = {
      projects: [],
      recordings: [],
      selectedProject: 0,
      createProjectModal: false,
      projectTitle: "",
      projectDescription: "",
      projectContext: null,
      projectContextSelection: 0,
      recordingIndex: 0,
      selectedRecordings: [],
      specData: [
        {
          data: null,
          label: "Spectrogram",
        },
      ],
      classification: null,
      tabValue: 1,
      specTabValue: 0,
      recordingData: {
        title: "",
        date: 0,
        temperature: 0,
        location: {
          latitude: 0,
          longitude: 0,
        },
        class: "",
      },
      recordingLocation: {
        lat: 0,
        lng: 0,
      },
      classifier: 0,
      specLoading: false,
      editProject: false,
      classifyAllProgress: 0,
      classifyAllLoading: false,
      recordingsMenu: null,
    };

    window.eel.expose(this.setSpectrogram, "setSpectrogram");
    window.eel.expose(this.classifiedRecording, "classifiedRecording");
  }

  componentDidMount() {
    document.addEventListener("contextmenu", (e) => {
      //e.preventDefault();
    });

    this.loadProjects();
  }

  loadProjects = () => {
    eel.get_projects()((projects) => {
      this.setState({ projects: projects || [] }, () => {
        this.selectProject(this.state.selectedProject);
      });
    });
  };

  selectProject = (projectIndex) => {
    const { projects } = this.state;
    if (!projects[projectIndex]) {
      this.setState({
        recordings: [],
      });
      return;
    }

    this.setState({
      recordings: projects[projectIndex].recordings,
      classifier: projects[projectIndex].classifier,
      selectedProject: projectIndex,
    });
  };

  createProject = () => {
    this.setState({ createProjectModal: false });
    const { projectTitle, projectDescription } = this.state;
    eel.add_project(
      projectTitle,
      projectDescription
    )(() => {
      this.loadProjects();
    });
  };

  addRecordings = () => {
    eel.add_recordings(this.state.selectedProject)(() => {
      this.loadProjects();
    });
  };

  handleProjectContext = (event, index) => {
    event.preventDefault();
    this.setState({
      projectContext:
        this.state.projectContext === null
          ? {
              mouseX: event.clientX + 2,
              mouseY: event.clientY - 6,
            }
          : null,
      projectContextSelection: index,
    });
  };

  removeProject = () => {
    this.setState({ projectContext: null });
    eel.remove_project(this.state.projectContextSelection)(() => {
      this.loadProjects();
    });
  };

  saveProject = () => {
    this.setState({ createProjectModal: false });
    const { projectTitle, projectDescription, projectContextSelection } =
      this.state;
    eel.save_project(
      projectContextSelection,
      projectTitle,
      projectDescription
    )(() => {
      this.loadProjects();
    });
  };

  editProject = () => {
    const { projects, projectContextSelection } = this.state;
    const project = projects[projectContextSelection];

    this.setState({
      projectContext: null,
      createProjectModal: true,
      projectTitle: project.title,
      projectDescription: project.description,
      editProject: true,
    });
  };

  removeRecordings = () => {
    const { selectedRecordings, selectedProject } = this.state;
    if (selectedRecordings.length > 0) {
      this.setState({ recordingsMenu: null });
      eel.remove_recordings(
        selectedProject,
        selectedRecordings
      )(() => {
        this.loadProjects();
        this.setState({ selectedRecordings: [] });
      });
    }
  };

  addMetadata = () => {
    eel.add_metadata(this.state.selectedProject)(() => {
      this.loadProjects();
    });
  };

  setSpectrogram = (specData) => {
    this.setState({
      specLoading: false,
      specData,
    });
  };

  selectRecording = (recording, recordingIndex) => {
    this.setState({
      specLoading: true,
      recordingData: recording,
      selectedRecording: recordingIndex,
      classification: recording.classification,
      recordingLocation: {
        lat: recording.location.latitude,
        lng: recording.location.longitude,
      },
      tabValue: 0,
    });
    eel.get_spectrogram(this.state.selectedProject, recordingIndex)();
  };

  classifyAll = () => {
    const { selectedProject, selectedRecordings } = this.state;
    this.setState({ classifyAllLoading: true, recordingsMenu: null });
    eel.classify_all(selectedProject)();
  };

  classifyRecordings = () => {
    const { selectedProject, selectedRecordings } = this.state;
    if (selectedRecordings.length > 0) {
      this.setState({
        classifyAllLoading: true,
        recordingsMenu: null,
        tabValue: 1,
      });
      eel.classify_all(selectedProject, selectedRecordings)();
    }
  };

  classify = () => {
    this.setState({ classifyLoading: true });
    const { selectedProject, selectedRecording, recordingData } = this.state;
    eel.classify(selectedProject, selectedRecording)();
  };

  classifiedRecording = (recordingIndex, classification, classes, progress) => {
    const newRecordings = this.state.recordings.slice();
    newRecordings[recordingIndex].class = classes.join(", ");
    newRecordings[recordingIndex].classification = classification;

    if (this.state.selectedRecording == recordingIndex) {
      let newRecordingData = this.state.recordings[recordingIndex];
      newRecordingData.class = classes.join(", ");
      this.setState({
        recordingData: newRecordingData,
        classification,
        classifyLoading: false,
      });
    }

    this.setState({
      recordings: newRecordings,
      classifyAllProgress: progress,
      classifyAllLoading: progress != 100,
    });
  };

  renderRecording = ({ index, style, data }) => {
    const { recordings, selectedRecording, selectedRecordings } = this.state;
    const recording = data[index];

    return (
      <ListItemButton
        alignItems="flex-start"
        selected={index == selectedRecording}
        style={{ ...style, padding: 0 }}
        key={index.toString()}
      >
        <Checkbox
          checked={selectedRecordings.includes(index)}
          onChange={(event) => {
            if (selectedRecordings.includes(index)) {
              this.setState({
                selectedRecordings: selectedRecordings.filter(
                  (idx) => idx != index
                ),
              });
            } else {
              this.setState({
                selectedRecordings: [...selectedRecordings, index],
              });
            }
          }}
        />
        <ListItemText
          primary={recording.title}
          onClick={() => this.selectRecording(recording, index)}
          secondary={
            <Typography
              noWrap
              style={{
                fontSize: 10,
                color: "#42a5f5",
                overflow: "hidden",
              }}
            >
              <Typography
                variant="subtitle2"
                style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.7)" }}
                display="inline"
              >
                {moment(recording.date).format("DD/MM/YYYY HH:mm:ss")}
              </Typography>
              {recording.class && (
                <Typography
                  style={{
                    fontSize: 10,
                    color: "#42a5f5",
                    marginLeft: 4,
                  }}
                  display="inline"
                >
                  {recording.class}
                </Typography>
              )}
            </Typography>
          }
          primaryTypographyProps={{ fontSize: 12, noWrap: true }}
        />
      </ListItemButton>
    );
  };

  render() {
    const {
      projects,
      recordings,
      selectedProject,
      createProjectModal,
      projectTitle,
      projectDescription,
      projectContext,
      selectedRecording,
      selectedRecordings,
      specData,
      classification,
      tabValue,
      specTabValue,
      recordingData,
      classifier,
      specLoading,
      classifyLoading,
      recordingLocation,
      editProject,
      classifyAllProgress,
      classifyAllLoading,
      recordingsMenu,
    } = this.state;

    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Grid container height="100%">
          <Grid
            item
            xs={1.75}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: window.innerHeight,
            }}
          >
            <List style={{ flex: 1 }}>
              {projects.map((project, index) => (
                <>
                  <ListItemButton
                    alignItems="flex-start"
                    key={index.toString()}
                    selected={index == selectedProject}
                    onClick={() => {
                      this.selectProject(index);
                    }}
                    onContextMenu={(event) => {
                      this.handleProjectContext(event, index);
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={project.recordings.length}
                        color="primary"
                      >
                        <Avatar>
                          <FolderIcon />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={project.title}
                      secondary={project.description}
                      primaryTypographyProps={{ noWrap: true }}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                  <Divider variant="inset" component="li" />
                </>
              ))}
            </List>
            <Box textAlign="center" style={{ marginBottom: 16 }}>
              <Button
                onClick={() =>
                  this.setState({
                    createProjectModal: true,
                    editProject: false,
                  })
                }
                variant="contained"
              >
                Create Project
              </Button>
            </Box>
          </Grid>
          <Divider orientation="vertical" flexItem sx={{ mr: "-1px" }} />
          <Grid
            item
            xs={1.75}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: window.innerHeight,
            }}
          >
            <Box
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <FormControlLabel
                style={{ marginRight: 0, marginLeft: 0 }}
                control={
                  <Checkbox
                    checked={
                      selectedRecordings.length > 0 &&
                      selectedRecordings.length == recordings.length
                    }
                    onChange={(event) => {
                      if (
                        selectedRecordings.length == recordings.length ||
                        recordings.length == 0
                      ) {
                        this.setState({
                          selectedRecordings: [],
                        });
                      } else {
                        this.setState({
                          selectedRecordings: Array.from(
                            Array(recordings.length).keys()
                          ),
                        });
                      }
                    }}
                  />
                }
                label="Select all"
              />
              <IconButton
                onClick={(event) =>
                  this.setState({ recordingsMenu: event.currentTarget })
                }
              >
                <MoreVertIcon />
              </IconButton>
            </Box>

            <FixedSizeList
              height={window.innerHeight - 150}
              width={"100%"}
              itemSize={48}
              itemCount={recordings.length}
              overscanCount={5}
              itemData={recordings}
              itemKey={(index, data) => {
                return index.toString();
              }}
            >
              {this.renderRecording}
            </FixedSizeList>
            <Box textAlign="center" style={{ marginBottom: 16 }}>
              <Button
                onClick={this.addRecordings}
                variant="outlined"
                style={{ marginBottom: 16 }}
              >
                Add Recordings
              </Button>
              <Button onClick={this.addMetadata} variant="outlined">
                Add Metadata
              </Button>
            </Box>
          </Grid>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ mr: "-1px", mt: "-1px" }}
          />
          <Grid item xs={8.5}>
            <Tabs
              value={specTabValue}
              onChange={(event, newValue) =>
                this.setState({ specTabValue: newValue })
              }
            >
              <Tab label={"Spectrogram"} />
            </Tabs>
            <Box
              style={{
                height: "50%",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <Fade
                in={specLoading}
                style={{
                  position: "absolute",
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <BackdropFilter
                    filter={"blur(10px)"}
                    canvasFallback={true}
                    className="bluredForm"
                  >
                    <CircularProgress
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </BackdropFilter>
                </div>
              </Fade>

              {specData != null && (
                <Spectrogram
                  data={specData}
                  id={"spectrogram"}
                  cols={specData.length}
                  rows={specData[0].length}
                  maxF={257 / 128}
                  maxS={1723} // pixels per second
                />
              )}
            </Box>
            <Divider flexItem sx={{ mr: "-1px" }} />
            <Tabs
              value={tabValue}
              onChange={(event, newValue) =>
                this.setState({ tabValue: newValue })
              }
            >
              <Tab label="Recording" />
              <Tab label="Project" />
            </Tabs>
            <Box
              style={{
                display: "block",
                flexDirection: "row",
                padding: 16,
                overflow: "hidden",
              }}
            >
              <Grid display={tabValue == 0 ? "flex" : "none"}>
                <Grid item xs={3}>
                  <Typography variant="h5" gutterBottom>
                    Metadata
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" noWrap>
                    Title: {recordingData.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" noWrap>
                    Date:{" "}
                    {moment(recordingData.date).format("DD/MM/YYYY HH:mm:ss")}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" noWrap>
                    Temperature: {recordingData.temperature} °C
                  </Typography>
                  <Typography variant="subtitle1" color="text.primary" noWrap>
                    Species: {recordingData.class || "-"}
                  </Typography>
                  <LoadingButton
                    onClick={this.classify}
                    variant="contained"
                    loading={classifyLoading}
                    style={{ marginTop: 16 }}
                  >
                    Classify
                  </LoadingButton>
                </Grid>

                <Grid item xs={3}>
                  <Typography variant="h6">Location</Typography>
                  <MapContainer
                    style={{
                      position: "relative",
                      width: 220,
                      height: 180,
                      borderRadius: 10,
                      marginTop: 4,
                      marginBottom: 12,
                    }}
                    center={recordingLocation}
                  />
                </Grid>

                <Grid item xs={6}>
                  {classification && (
                    <BarChart
                      id={"predictionChart"}
                      values={classification.prediction}
                      categories={classifiers[classifier].classes}
                    />
                  )}
                </Grid>
              </Grid>
              <Box display={tabValue == 1 ? "flex" : "none"}>
                <Select
                  value={classifier}
                  label="Classifier"
                  onChange={(event) => {
                    this.setState({ classifier: event.target.value });
                    eel.set_classifier(
                      selectedProject,
                      event.target.value
                    )(() => this.loadProjects());
                  }}
                >
                  {classifiers.map((c, i) => (
                    <MenuItem value={i}>{c.name}</MenuItem>
                  ))}
                </Select>
                <Button
                  onClick={this.classifyAll}
                  variant="contained"
                  style={{ marginLeft: 12 }}
                  disabled={classifyAllLoading}
                >
                  {classifyAllLoading ? (
                    <CircularProgress
                      color="inherit"
                      variant={
                        classifyAllLoading && classifyAllProgress == 0
                          ? "indeterminate"
                          : "determinate"
                      }
                      size={16}
                      value={classifyAllProgress}
                    />
                  ) : (
                    "Classify all"
                  )}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Dialog
          open={createProjectModal}
          onClose={() => this.setState({ createProjectModal: false })}
        >
          <DialogTitle>Create Project</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Create a new project and add your recordings to analyze and
              classify them.
            </DialogContentText>
            <TextField
              autoFocus
              label="Title"
              fullWidth
              variant="outlined"
              margin="normal"
              value={projectTitle}
              onChange={(event) =>
                this.setState({ projectTitle: event.target.value })
              }
              required
            />
            <TextField
              autoFocus
              label="Description"
              fullWidth
              variant="outlined"
              margin="normal"
              value={projectDescription}
              onChange={(event) =>
                this.setState({ projectDescription: event.target.value })
              }
              multiline
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                this.setState({
                  createProjectModal: false,
                  projectTitle: "",
                  projectDescription: "",
                })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={editProject ? this.saveProject : this.createProject}
              variant="contained"
            >
              {editProject ? "Save" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        <Menu
          open={projectContext !== null}
          onClose={() => this.setState({ projectContext: null })}
          anchorReference="anchorPosition"
          anchorPosition={
            projectContext !== null
              ? {
                  top: projectContext.mouseY,
                  left: projectContext.mouseX,
                }
              : undefined
          }
        >
          <MenuItem onClick={this.editProject}>
            <ListItemIcon>
              <EditOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography>Edit</Typography>
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={this.removeProject}>
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>
              <Typography color="error">Delete</Typography>
            </ListItemText>
          </MenuItem>
        </Menu>

        <Menu
          open={recordingsMenu !== null}
          onClose={() => this.setState({ recordingsMenu: null })}
          anchorEl={recordingsMenu}
        >
          <MenuItem onClick={this.classifyRecordings}>
            <ListItemIcon>
              <ThinkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography>Classify</Typography>
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={this.removeRecordings}>
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>
              <Typography color="error">Delete</Typography>
            </ListItemText>
          </MenuItem>
        </Menu>
      </ThemeProvider>
    );
  }
}

export default App;
