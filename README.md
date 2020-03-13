# JiraLogsAnalytics
Simple data visualizer tool for Jira Sprint Logs. 

* Landing screen
![1](/docs/LandingScreen.PNG)

* You can view general sprint info
![Screenshot](/docs/GeneralSpringInformation.png)

* You can view overall project info, and list the uncompleted tasks.
![Screenshot](/docs/ProjectOverall.PNG)

* You can view the employee-sprint information

* You can view the tasks overall and sprint overall
![Screenshot](/docs/TasksOverall.PNG)

### To integrate to your use case please change the item's fields in js files.
```
        if (rowData.length <= 14 && rowData.length >= 12) {
            item = {
                sprintName: fileName,
                issueKey: rowData[0],
                issueId: rowData[1],
                summary: rowData[2],
                assignee: isEmpty(rowData[3]) ? "Unassigned" : toTitleCase(rowData[3].split('.').join(' ')),
                status: rowData[4],
                projectKey: rowData[5],
                projectName: rowData[6],
                projectType: rowData[7],
                projectLead: rowData[8],
                projectDescription: rowData[9],
                projectUrl: rowData[10],
                storyPoints: rowData[11],
                wp: rowData[12]
            };
            items.push(item);
        }
```
